import _ from "lodash";
// import { difference } from "../../utils";
import { IUISchema, INodeController, IUINode } from "uiengine/typings";
import { NodeController, UINode } from "uiengine";
import { FileLoader } from ".";

export class VersionControl implements IVersionControl {
  static instance: IVersionControl;
  static getInstance() {
    if (!VersionControl.instance) {
      VersionControl.instance = new VersionControl();
    }
    return VersionControl.instance;
  }

  histories: Array<IHistory> = [];
  position: number = -1;
  nodeController: INodeController = NodeController.getInstance();
  private fileLoader: IFileLoader = FileLoader.getInstance();
  private debounced: any;

  private async reloadSchema(schema: IUISchema) {
    const activeLayout = this.nodeController.activeLayout;
    const uiNode = this.nodeController.getLayout(activeLayout, true);
    if (uiNode instanceof UINode) {
      await uiNode.replaceLayout(_.cloneDeep(schema));
      await uiNode.sendMessage(true);
    }
  }

  // store every 3 seconds
  private cacheSchema(schema: IUISchema) {
    if (this.debounced) this.debounced.cancel();
    this.debounced = _.debounce(() => {
      if (this.fileLoader.editingFile) {
        this.fileLoader.saveFile(this.fileLoader.editingFile, schema, "schema");
        sessionStorage.savedTime = new Date().toLocaleTimeString();
      }
    }, 1000)();
  }

  push(schema: IUISchema) {
    // remove backwards histories
    if (this.position < this.histories.length - 1) {
      const result = this.histories.splice(
        this.position + 1,
        this.histories.length - this.position - 1
      );
    }

    // add new
    const cloneSchema = _.cloneDeep(schema);
    const history: IHistory = {
      version: _.uniqueId(),
      schema: cloneSchema
    };
    this.histories.push(history);
    this.position = this.histories.length - 1;

    // cache
    this.cacheSchema(cloneSchema);
  }

  async redo() {
    if (this.position >= this.histories.length - 1) return;
    this.position++;
    if (this.histories[this.position]) {
      const schema = this.histories[this.position].schema;
      await this.reloadSchema(schema);
      this.cacheSchema(schema);
      return schema;
    }
  }

  async undo() {
    if (this.position <= 0) return;
    if (this.histories.length === 0) return;
    this.position--;
    if (this.histories[this.position]) {
      const schema = this.histories[this.position].schema;
      await this.reloadSchema(schema);
      this.cacheSchema(schema);
      return schema;
    }
  }

  clearHistories() {
    this.histories = [];
    this.position = -1;
  }
}
