import React, {act} from "react";
import {createRoot} from "react-dom/client";
import {ChatChannelView} from "./ChatChannelView";

jest.mock("./ChatExperience", () => ({
    ChatExperience: (props) => <div data-testid="chat-experience" data-props={JSON.stringify(props)} />,
}));

describe("ChatChannelView public contract", () => {
    let container;
    let root;

    beforeEach(() => {
        global.IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        delete global.IS_REACT_ACT_ENVIRONMENT;
    });

    test.each(["page", "overlay"])("forwards the controlled %s presentation", async (presentation) => {
        await act(async () => root.render(
            <ChatChannelView active channelId={42} autoFocusComposer={false} headerActions="actions" presentation={presentation} />,
        ));
        const props = JSON.parse(container.querySelector('[data-testid="chat-experience"]').dataset.props);

        expect(props).toMatchObject({
            active: true,
            channelId: 42,
            autoFocusComposer: false,
            headerActions: "actions",
            presentation,
        });
    });

    test("defaults to the future overlay-safe layout", async () => {
        await act(async () => root.render(<ChatChannelView channelId={3} />));
        const props = JSON.parse(container.querySelector('[data-testid="chat-experience"]').dataset.props);
        expect(props.presentation).toBe("overlay");
    });
});
