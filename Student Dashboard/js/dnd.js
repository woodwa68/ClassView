/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eric Bidelman (ericbidelman@chromium.org)
*/

function DnDFileController(selector, onDropCallback) {
  var dragging = 0;
  var el_ = document.querySelector(selector);

  this.dragenter = function(event) {
    dragging++;
    el_.classList.add('dropping');

    event.stopPropagation();
    event.preventDefault();
    return false;
  };

  this.dragover = function(event) {
    el_.classList.add('dropping');

    event.stopPropagation();
    event.preventDefault();
    return false;
  };

  this.dragleave = function(event) {
    dragging--;
    if (dragging === 0) {
        el_.classList.remove('dropping');
    }

    event.stopPropagation();
    event.preventDefault();
    return false;
  };

  this.drop = function(e) {
    dragging = 0;
    e.stopPropagation();
    e.preventDefault();

    el_.classList.remove('dropping');

    onDropCallback.bind(this)(e.dataTransfer.files);
  };

  el_.addEventListener('dragenter', this.dragenter, false);
  el_.addEventListener('dragover', this.dragover, false);
  el_.addEventListener('dragleave', this.dragleave, false);
  el_.addEventListener('drop', this.drop, false);
};



