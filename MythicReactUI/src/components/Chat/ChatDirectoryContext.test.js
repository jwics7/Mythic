import {getChatReadState, mergeChatDirectoryRows, mergeChatReadStateRows, sortChatChannels} from "./ChatDirectoryContext";

describe("Chat directory state", () => {
    test("merges streamed channel updates without letting stale rows replace current state", () => {
        const current = [
            {id: 1, name: "General", archived: false, channel_type: "standard", updated_at: "2026-07-14T10:00:00Z"},
            {id: 2, name: "Archive", archived: true, channel_type: "standard", updated_at: "2026-07-14T10:00:00Z"},
        ];
        const incoming = [
            {id: 1, name: "Stale", archived: false, channel_type: "standard", updated_at: "2026-07-14T09:00:00Z"},
            {id: 3, name: "AI", archived: false, channel_type: "ai", updated_at: "2026-07-14T11:00:00Z"},
        ];

        const merged = mergeChatDirectoryRows(current, incoming);
        expect(merged.find(({id}) => id === 1).name).toBe("General");
        expect(merged.map(({id}) => id)).toEqual([3, 1, 2]);
        expect([...merged].sort(sortChatChannels)).toEqual(merged);
    });

    test("read state is monotonic and preserves local mute changes", () => {
        const current = {
            7: {lastReadMessageID: 40, muted: true, updatedAt: "2026-07-14T10:00:00Z"},
        };
        const merged = mergeChatReadStateRows(current, [
            {channel_id: 7, last_read_message_id: 20, muted: false, updated_at: "2026-07-14T09:00:00Z"},
            {channel_id: 8, last_read_message_id: 12, muted: false, updated_at: "2026-07-14T11:00:00Z"},
        ]);

        expect(getChatReadState(merged, 7)).toEqual(current[7]);
        expect(getChatReadState(merged, 8)).toMatchObject({lastReadMessageID: 12, muted: false});
        expect(getChatReadState(merged, 99)).toEqual({lastReadMessageID: 0, muted: false, updatedAt: null});
    });
});
