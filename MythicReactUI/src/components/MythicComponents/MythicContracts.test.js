import React, {act} from "react";
import {createRoot} from "react-dom/client";
import {MythicCluster, MythicGrid, MythicStack, MythicTruncatedText} from "./MythicLayout";
import {MythicActionButton, MythicListRow, MythicPanel, MythicText, MythicToolbar} from "./MythicContent";
import {MythicTransferListPane} from "./MythicTransferList";
import {MythicStatusChip} from "./MythicStatusChip";

describe("Mythic shared visual contracts", () => {
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

    test("exposes inspectable layout contracts and curated variants", async () => {
        await act(async () => root.render(
            <MythicStack gap="md" fill>
                <MythicCluster justify="between" wrap={false}>Actions</MythicCluster>
                <MythicGrid columns="two" minWidth="compact">Grid</MythicGrid>
                <MythicTruncatedText lines={2}>Long text</MythicTruncatedText>
            </MythicStack>,
        ));

        expect({...container.querySelector('[data-mythic-component="stack"]').dataset}).toMatchObject({gap: "md", fill: "true"});
        expect({...container.querySelector('[data-mythic-component="cluster"]').dataset}).not.toHaveProperty("wrap");
        expect({...container.querySelector('[data-mythic-component="grid"]').dataset}).toMatchObject({columns: "two", minWidth: "compact"});
        expect(container.querySelector('[data-mythic-component="truncated-text"]').dataset.lines).toBe("2");
    });

    test("exposes surface, control, row, and status ownership", async () => {
        await act(async () => root.render(
            <MythicPanel density="compact" interactive tone="raised">
                <MythicToolbar density="compact">Toolbar</MythicToolbar>
                <MythicListRow selected>Selected</MythicListRow>
                <MythicText preset="label">Label</MythicText>
                <MythicActionButton tone="warning">Run</MythicActionButton>
                <MythicTransferListPane title="Available"><div>Item</div></MythicTransferListPane>
                <MythicStatusChip size="compact" status="success" />
            </MythicPanel>,
        ));

        expect({...container.querySelector('[data-mythic-component="panel"]').dataset}).toMatchObject({
            density: "compact",
            interactive: "true",
            tone: "raised",
        });
        expect(container.querySelector('[data-mythic-component="toolbar"]').dataset.density).toBe("compact");
        expect(container.querySelector('[data-mythic-component="list-row"]').dataset.selected).toBe("true");
        expect(container.querySelector('[data-mythic-component="text"]').dataset.preset).toBe("label");
        expect(container.querySelector('[data-mythic-component="action-button"]').dataset.tone).toBe("warning");
        expect(container.querySelector('[data-mythic-component="transfer-list-pane"]')).not.toBeNull();
        expect({...container.querySelector('[data-mythic-component="status-chip"]').dataset}).toMatchObject({
            size: "compact",
            tone: "success",
        });
    });
});
