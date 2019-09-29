import React, { useContext, useState, useMemo, useEffect } from "react";
import _ from "lodash";
import { Collapse, Form, Icon, TreeSelect } from "antd";
import { PropItem } from "./PropItem";
import { IDEEditorContext, GlobalContext } from "../../Context";
import { IDERegister, formatTitle, DndNodeManager } from "../../../helpers";

const Panel = Collapse.Panel;

export const Props: React.FC = (props: any) => {
  const { editNode } = useContext(IDEEditorContext);
  const { preview } = useContext(GlobalContext);

  let componentInfo: IComponentInfo = {} as IComponentInfo;
  if (editNode) {
    componentInfo = IDERegister.getComponentInfo(editNode.schema.component);
    // console.log(componentInfo, editNode);
  }

  const {
    title,
    component = _.get(editNode, "schema.component"),
    schema
  } = componentInfo;

  let allEvents, restSchema;
  if (schema) {
    const { events, ...rest } = schema;
    allEvents = events;
    restSchema = rest;
  }

  const formItemLayout = {
    colon: false,
    labelCol: {
      xs: { span: 6 },
      sm: { span: 6 }
    },
    wrapperCol: {
      xs: { span: 16 },
      sm: { span: 16 }
    }
  };

  const genExtra = (icons: string = "plus") => (
    <Icon
      type={icons}
      onClick={event => {
        event.stopPropagation();
      }}
    />
  );

  const [treeValue, selectTreeValue] = useState(component);
  const onTreeChange = (value: any, label: any, extra: any) => {
    if (value && value.indexOf("component-category-") === -1) {
      const dndNodeManager = DndNodeManager.getInstance();
      dndNodeManager.pushVersion();
      _.remove(editNode, "schema.props");
      _.remove(editNode, "schema.children");
      _.remove(editNode, "schema.$children");
      _.remove(editNode, "schema.$_children");
      _.remove(editNode, "schema.$template");
      editNode.schema.component = value;
      editNode.schema.props = _.get(
        extra,
        "triggerNode.props.defaultProps",
        {}
      );
      selectTreeValue(value);
      editNode.sendMessage(true);
    }
  };

  useEffect(() => {
    selectTreeValue(component);
  }, [editNode]);

  const treeData = useMemo(() => IDERegister.componentsLibrary, []);
  const disabled = false; //_.has(editNode, "props.ide_droppable") || preview;

  // console.log("edit node", plugins, _.find(editNode.$events, { event: name }));
  return (
    <div className="ide-props-events">
      <TreeSelect
        dropdownClassName="cancel-drag"
        showSearch
        className={"component-select"}
        value={treeValue}
        dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
        treeData={treeData}
        placeholder={formatTitle(title)}
        treeDefaultExpandAll
        onChange={onTreeChange}
        disabled={disabled}
      />

      <Collapse accordion defaultActiveKey={"props"}>
        {!_.isEmpty(restSchema) ? (
          <Panel header="Component Props" key="props">
            <Form
              {...formItemLayout}
              style={{ maxHeight: "400px", overflow: "auto" }}
            >
              {Object.entries(restSchema).map((entry: any) => (
                <PropItem
                  section="prop"
                  name={entry[0]}
                  schema={entry[1]}
                  key={`key-${entry[0]}`}
                  uinode={editNode}
                  data={_.get(editNode, `schema.props.${entry[0]}`)}
                />
              ))}
            </Form>
          </Panel>
        ) : null}
        <Panel header="Component Layout" key="layout">
          <Form {...formItemLayout}>
            <PropItem
              section="layout"
              type="layout"
              uinode={editNode}
              data={_.get(editNode, `schema.layout`)}
            />
          </Form>
        </Panel>
        <Panel header="Data Source" key="data-source" extra={genExtra()}>
          <Form {...formItemLayout}>
            <PropItem
              section="datasource"
              type="datasource"
              data={_.get(editNode, "schema.datasource")}
              uinode={editNode}
            />
          </Form>
        </Panel>
        {!_.isEmpty(allEvents) ? (
          <Panel header="Events" key="events">
            <Form {...formItemLayout}>
              {allEvents.map((name: any) => (
                <PropItem
                  section="event"
                  name={name}
                  type="event"
                  key={`key-${name}`}
                  uinode={editNode}
                  data={_.find(_.get(editNode, `schema.props.$events`, {}), {
                    event: name
                  })}
                />
              ))}
            </Form>
          </Panel>
        ) : null}
        <Panel header="Dependency" key="dependency">
          <Form>
            <PropItem
              section="dependency"
              type="dependency"
              uinode={editNode}
              data={_.get(editNode, "schema.state", {})}
            />
          </Form>
        </Panel>
        <Panel header="Table Define" key="2-dim">
          <Form {...formItemLayout}>
            <PropItem
              section="children"
              type="children"
              data={_.get(editNode, "schema.$_children")} // converted $$children to $_children on plugin
              uinode={editNode}
              config={props.config}
            />
          </Form>
        </Panel>
      </Collapse>
    </div>
  );
};
