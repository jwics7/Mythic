import React from "react";
import {ChatExperience} from "./ChatExperience";

export function ChatChannelView({presentation = "overlay", ...props}) {
    return <ChatExperience {...props} presentation={presentation} />;
}
