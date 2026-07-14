import React, {act} from "react";
import {createRoot} from "react-dom/client";
import {ChatPage} from "./ChatPage";

const mockSaveSetting = jest.fn();
let mockExperienceProps;

jest.mock("./ChatExperience", () => ({
    ChatExperience: (props) => {
        mockExperienceProps = props;
        return <button onClick={() => props.onChannelChange(19)}>Select channel</button>;
    },
}));
jest.mock("../MythicComponents/MythicSavedUserSetting", () => ({
    useGetMythicSetting: () => 7,
    useSetMythicSetting: () => [mockSaveSetting],
}));

describe("ChatPage selection ownership", () => {
    let container;
    let root;

    beforeEach(() => {
        global.IS_REACT_ACT_ENVIRONMENT = true;
        mockSaveSetting.mockClear();
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        delete global.IS_REACT_ACT_ENVIRONMENT;
    });

    test("controls the page channel and persists changes under the existing key", async () => {
        await act(async () => root.render(<ChatPage />));
        expect(mockExperienceProps).toMatchObject({active: true, channelId: 7, presentation: "page"});

        await act(async () => container.querySelector("button").click());

        expect(mockExperienceProps.channelId).toBe(19);
        expect(mockSaveSetting).toHaveBeenCalledWith({
            setting_name: "chatSelectedChannelID",
            value: 19,
            broadcast: false,
        });
    });
});
