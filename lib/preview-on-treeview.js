'use babel';

import PreviewOnTreeviewView from './preview-on-treeview-view';
import CompositeDisposable from 'atom';

export default {

    previewOnTreeviewView: null,

    config: {
        'target-extensions': {
            title: 'Target Extensions',
            description: 'Select the image type for displaying the preview(by a comma-separated list).',
            type: 'string',
            default: '.jpg, .jpeg, .png, .gif, .webp, .svg, .bmp, .ico'
        }
    },

    activate(state) {
        this.previewOnTreeviewView = new PreviewOnTreeviewView(state.previewOnTreeviewViewState);
    },

    deactivate() {
        this.previewOnTreeviewView.destroy();
    },

    serialize() {
        return {
            previewOnTreeviewViewState: this.previewOnTreeviewView.serialize()
        };
    }

};
