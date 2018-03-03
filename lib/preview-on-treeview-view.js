'use babel';
import {
    CompositeDisposable
} from 'atom';

export default class PreviewOnTreeviewView {

    constructor(serializedState) {
        //delay loading to wait for TreeView initialization
        atom.packages.onDidActivateInitialPackages(() => this.initialize());
    }

    initialize() {
        this.disposable = new CompositeDisposable();

        // Create root element
        this.element = document.createElement('div');
        this.element.classList.add('preview-on-treeview');
        this.element.classList.add('hidden');
        let parent = document.querySelector('.vertical > .panes > .pane');
        if (!parent) parent = document.body;
        parent.appendChild(this.element);

        // Create container element
        const container = document.createElement('div');
        container.classList.add('container');
        this.element.appendChild(container);

        // Create message element
        this.msgelem = document.createElement('div');
        this.msgelem.classList.add('message');
        container.appendChild(this.msgelem);

        // Create image element
        this.imageelem = document.createElement('img');
        container.appendChild(this.imageelem);

        // Get TreeView object
        this.treeview = null;
        var panes = atom.workspace.getPanes()
        for (let pane of panes) {
            if (pane.activeItem) {
                if (pane.activeItem.constructor.name == 'TreeView') {
                    this.treeview = pane.activeItem;
                }
            }
        }

        // Start treeview observing
        this.connectTreeView();

        // Start event capturing
        this.initCapture();
    }

    // Returns an object that can be retrieved when package is activated
    serialize() {}

    // Tear down any state and detach
    destroy() {
        this.disconnectTreeView();
        this.resetCapture();
        this.element.remove();
        this.element = null;
        this.msgelem.remove();
        this.msgelem = null;
        this.imageelem.remove();
        this.imageelem = null;
        this.treeview = null;
        this.treeelems = null;
        this.disposable = null;
    }

    //initialize capturing of mouse events
    initCapture() {
        if (this.treeview) {
            //get tree view items
            const elems = this.treeview.element.querySelectorAll('.list-tree > .list-item');

            //check file type
            const patterns = atom.config.get('preview-on-treeview.target-extensions');
            const ptnlist = patterns.split(/\s*,\s*/);
            const checktype = (path) => {
                for (let ptn of ptnlist) {
                    if (path.endsWith(ptn)) return true;
                }
                return false;
            }

            //register event listeners
            for (let i = 0; i < elems.length; i++) {
                const nameelems = elems[i].getElementsByClassName('name');
                if (nameelems) {
                    const datapath = nameelems[0].getAttribute('data-path');
                    if (datapath && checktype(datapath)) {
                        elems[i].addEventListener('mouseover', e => this.onMouseOver(e));
                        elems[i].addEventListener('mouseout', e => this.onMouseOut(e));
                    }
                }
            }
            this.treeelems = elems;
        }
    }

    //release capturing of mouse events
    resetCapture() {
        if (this.treeelems) {
            const elems = this.treeelems;
            for (let i = 0; i < elems.length; i++) {
                elems[i].removeEventListener('mouseover', e => this.onMouseOver(e));
                elems[i].removeEventListener('mouseout', e => this.onMouseOut(e));
            }
        }
    }

    //initialize event listeners for TreeView
    connectTreeView() {
        const dp = this.disposable;
        const tv = this.treeview;
        dp.add(tv.onEntryCopied(e => this.onUpdateTreeView(e)));
        dp.add(tv.onEntryDeleted(e => this.onUpdateTreeView(e)));
        dp.add(tv.onEntryMoved(e => this.onUpdateTreeView(e)));
        dp.add(tv.onEntryCopied(e => this.onUpdateTreeView(e)));
        dp.add(tv.onFileCreated(e => this.onUpdateTreeView(e)));
        dp.add(atom.project.onDidChangeFiles(e => this.onFileUpdate(e)));
        dp.add(atom.config.onDidChange(e => this.onConfigUpdate(e)));
    }

    //release event listeners for TreeView
    disconnectTreeView() {
        this.disposable.dispose();
        this.disposable.clear();
    }

    //called when Tree items are changed
    onUpdateTreeView() {
        this.resetCapture();
        this.initCapture();
    }

    //called then the file is changed in the project directory
    onFileUpdate(events) {
        //check the event type.
        //I don't want to call resetCapture() on overwriting a file,
        //event though its cost is not heavy.
        let flag = false;
        for (let e of events) {
            if (e.action == 'created' || e.action == 'renamed') {
                flag = true;
            }
        }
        if (flag) {
            this.onUpdateTreeView();
        }
    }

    //called when parameters are changed.
    onConfigUpdate(e) {
        this.onUpdateTreeView();
    }

    //called when the mouse cursor moves on the treeview item.
    onMouseOver(e) {
        const datapath = e.srcElement.getAttribute('data-path');
        if (datapath) {
            this.imageelem.src = datapath;
            const dataname = e.srcElement.getAttribute('data-name');
            if (dataname) {
                this.msgelem.textContent = dataname;
            }
            this.show();
        }
    }

    //called when the mouse cursor leaves from the treeview item.
    onMouseOut(e) {
        this.hide();
        this.imageelem.src = '';
    }

    show() {
        this.element.classList.remove('hidden');
    }

    hide() {
        this.element.classList.add('hidden');
    }
}
