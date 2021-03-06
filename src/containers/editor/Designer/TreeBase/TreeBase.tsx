import React, { useState, useContext, useCallback } from "react";
import _ from "lodash";
import { Tree } from "antd";
import { renderTreeNodes } from "./renderTreeNodes";
import { SchemasContext, IDEEditorContext } from "../../../Context";
import {
  loadFileAndRefresh,
  getActiveUINode,
  FileLoader,
  VersionControl
} from "../../../../helpers";

export const TreeBase = (props: any) => {
  const { selectedKeys, setSelectedKey, toggleRefresh } = useContext(
    SchemasContext
  );
  const { content, setContent, activeTab, tabs } = useContext(IDEEditorContext);
  const { tree, openKeys } = props;

  const [expandKeys, setExpandKeys] = useState<string[]>(openKeys);
  const [autoExpandParent, setAutoExpandParent] = useState(false);
  const onExpand = useCallback(
    (expandKeys: string[]) => {
      setExpandKeys(expandKeys);
      setAutoExpandParent(false);
    },
    [tree]
  );

  const onRefresh = useCallback(() => {
    toggleRefresh();
  }, []);

  let defaultExpandedKeys: any = [];

  const onSelect = useCallback(
    async (keys: string[], treeNode?: any) => {
      const dataRef = _.get(treeNode, "node.props.dataRef", treeNode);
      const type = _.get(dataRef, "type", "schema");
      const nodeType = _.get(dataRef, "nodeType");
      const isTemplate = _.get(dataRef, "isTemplate", false);
      const name = _.get(dataRef, "name", "");
      if (
        (!_.has(treeNode, "node.props.dataRef._editing_") ||
          (_.has(treeNode, "node.props.dataRef._editing_") &&
            treeNode.node.props.dataRef._editing_ === false)) &&
        name !== ""
      ) {
        if (
          keys.length &&
          nodeType === "file" &&
          !(type === "plugin" && isTemplate)
        ) {
          const tabContent = _.find(tabs, { tab: keys[0] });
          if (!tabContent) {
            const data = await loadFileAndRefresh(keys[0], type, isTemplate);
            setContent({ content: data, file: keys[0], type });
          } else {
            const fileLoader = FileLoader.getInstance();
            const versionControl = VersionControl.getInstance();
            versionControl.clearHistories();
            fileLoader.editingFile = keys[0];
            if (type === "schema") {
              const text = _.find(content, { file: keys[0] });
              if (text) {
                if (_.isString(text.content)) {
                  try {
                    const schema = JSON.parse(text.content);
                    const uiNode = getActiveUINode();
                    uiNode.schema = schema;
                    // uiNode.refreshLayout();
                    // uiNode.sendMessage(true);
                  } catch (e) {
                    console.error(e);
                  }
                }
              }
            }
          }
          if (type === "schema") {
            activeTab(`drawingboard:${keys[0]}`, type, "", isTemplate);
          } else {
            activeTab(keys[0], type, "", isTemplate);
          }
        }
        setSelectedKey(keys, dataRef);
      }
    },
    [tree, activeTab, tabs]
  );

  const followProps = {
    onSelect,
    onExpandKeys: (keys: any) => {
      setExpandKeys(keys);
    },
    onAutoExpandParent: setAutoExpandParent,
    onRefresh: onRefresh,
    expandKeys: expandKeys
  };

  return (
    <div className="pagetree">
      <Tree.DirectoryTree
        showLine
        onExpand={onExpand}
        onSelect={onSelect}
        autoExpandParent={autoExpandParent}
        defaultExpandedKeys={defaultExpandedKeys}
        expandedKeys={expandKeys}
        selectedKeys={selectedKeys}
      >
        {renderTreeNodes(tree, followProps)}
      </Tree.DirectoryTree>
    </div>
  );
};
