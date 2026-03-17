export default class UiFolder {
    label: string;

    name: string;

    parentFolderType: string;

    constructor(label: string, name: string, parentFolderType: string) {
        this.label = label;
        this.name = name;
        this.parentFolderType = parentFolderType;
    }
}
