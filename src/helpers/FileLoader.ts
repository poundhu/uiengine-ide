import _ from "lodash";
import { StorageAdapter } from "./StorageAdapter";
import * as commands from "./websocket";

export class FileLoader implements IFileLoader {
  static storageType: EStorageType = "Local";
  static instance: IFileLoader;
  static getInstance() {
    if (!FileLoader.instance) {
      FileLoader.instance = new FileLoader();
    }
    return FileLoader.instance;
  }
  storage: IStorage;

  private trees = {
    schema: {},
    plugins: {}
  };

  editingFile: string = "";

  constructor() {
    StorageAdapter.type = FileLoader.storageType;
    this.storage = StorageAdapter.getInstance();
  }

  private isTempStorage() {
    return (
      FileLoader.storageType === "Local" || FileLoader.storageType === "Session"
    );
  }

  private clearTree(treeRoot: IFileTree) {
    let root = treeRoot;
    const newNode = {} as IFileTree;
    _.forIn(root, (value: any, key: any) => {
      if (key[0] !== "_") {
        newNode[key] = value;
      }
    });

    if (root.children && root.children.length) {
      root.children.forEach((node: IFileTree, i: number) => {
        root.children[i] = this.clearTree(node);
      });
    }
    return newNode;
  }

  saveTree(treeRoot: IFileTree, type: EResourceType) {
    const clearNodes = this.clearTree(treeRoot);
    this.storage.save(`file_tree.${type}`, JSON.stringify(clearNodes.children));
  }

  saveFile(
    path: string,
    content: any,
    type: EResourceType,
    treeRoot?: IFileTree
  ): boolean {
    console.log("saving ...", path);
    // store tree
    if (this.isTempStorage() && treeRoot) {
      this.saveTree(treeRoot, type);
    }

    this.storage.save(`${type}/${path}`, JSON.stringify(content));
    return true;
  }

  loadFileTree(type: EResourceType = "schema") {
    const newPromise = new Promise((resolve: any) => {
      const fileTreeJson = this.storage.get(`file_tree.${type}`);
      if (fileTreeJson) {
        try {
          let result = JSON.parse(fileTreeJson);
          resolve(result);
        } catch (e) {
          resolve([]);
        }
        // result = _.unionBy(localTree.children, localTree, "name");
      } else {
        const promise = commands.getFileList(type);
        promise.then((tree: any) => {
          // cache to local storage
          this.storage.save(`file_tree.${type}`, JSON.stringify(tree));
          resolve(tree);
        });
      }
    });
    return newPromise;
  }

  loadFile(path: string, type: EResourceType = "schema") {
    const newPromise = new Promise((resolve: any) => {
      const promise = commands.readFile(type, path);
      promise.then((data: any) => {
        let content = this.storage.get(`${type}/${path}`);
        if (type === "schema" && content) {
          content = JSON.parse(content);
          // if (!_.isEqual(content, data)) {
          //   console.log(data, "schemas are different");
          // }
        }
        resolve(content || data);
      });
    });

    return newPromise;
  }

  removeFile(path: string, type?: string, treeRoot?: IFileTree): boolean {
    if (type === "schema") {
      if (this.isTempStorage() && treeRoot) {
        this.saveTree(treeRoot, type);
      }
    }
    return this.storage.remove(`${type}/${path}`);
  }
}
