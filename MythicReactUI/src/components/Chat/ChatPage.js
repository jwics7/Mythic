import React from "react";
import {ChatExperience} from "./ChatExperience";
import {useGetMythicSetting, useSetMythicSetting} from "../MythicComponents/MythicSavedUserSetting";

const CHAT_SELECTED_CHANNEL_SETTING = "chatSelectedChannelID";

export function ChatPage(props) {
    const savedChannelID = useGetMythicSetting({
        setting_name: CHAT_SELECTED_CHANNEL_SETTING,
        default_value: 0,
    });
    const [selectedChannelID, setSelectedChannelID] = React.useState(Number(savedChannelID) || null);
    const [saveMythicSetting] = useSetMythicSetting();

    React.useEffect(() => {
        setSelectedChannelID(Number(savedChannelID) || null);
    }, [savedChannelID]);

    const selectChannel = React.useCallback((channelID) => {
        const numericChannelID = Number(channelID) || null;
        setSelectedChannelID(numericChannelID);
        if(numericChannelID){
            saveMythicSetting({
                setting_name: CHAT_SELECTED_CHANNEL_SETTING,
                value: numericChannelID,
                broadcast: false,
            });
        }
    }, [saveMythicSetting]);

    return (
        <ChatExperience
            {...props}
            active
            channelId={selectedChannelID}
            onChannelChange={selectChannel}
            presentation="page"
        />
    );
}
