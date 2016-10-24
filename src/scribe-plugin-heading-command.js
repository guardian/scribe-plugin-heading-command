define(function (useAlternativeImplementation) {

  /**
   * This plugin adds a command for headings.
   */

  'use strict';

  return function (level) {
    return function (scribe) {
      var tagName = 'h' + level;
      var tag = '<' + tagName + '>';
      var nodeName = 'H' + level;
      var commandName = 'h' + level;

      /**
       * Chrome: the `heading` command doesn't work. Supported by Firefox only.
       */

      var headingCommand = new scribe.api.Command('formatBlock');

      /**
       * Alternative implementation is manual and works under Shadow DOM with WebComponents.js polyfill
       */
      if (useAlternativeImplementation) {
        headingCommand.execute = function () {
          scribe.transactionManager.run(function () {
            var selection = this.getSelection();
            var nodeToReplace = selection.anchorNode.parentNode;
            var newNode;
            if (nodeToReplace.nodeName == nodeName) {
              newNode = document.createElement('p');
            } else {
              newNode = document.createElement(tag);
            }
            newNode.innerHTML = nodeToReplace.innerHTML;
            nodeToReplace.parentNode.replaceChild(newNode, nodeToReplace);
            selection.removeAllRanges();
            var range = document.createRange();
            range.selectNodeContents(newNode.childNodes[0]);
            selection.addRange(range);
          }.bind(this));
        };
      } else {
        headingCommand.execute = function () {
          if (this.queryState()) {
            scribe.api.Command.prototype.execute.call(this, '<p>');
          } else {
            scribe.api.Command.prototype.execute.call(this, tag);
          }
        };
      }

      /**
       * Getting selection while being ready that it might be within Shadow DOM
       */
      headingCommand.getSelection = function () {
        var activeElement = document.activeElement,
            lastRoot = document;
        while (activeElement.shadowRoot) {
          lastRoot = activeElement.shadowRoot;
          activeElement = activeElement.shadowRoot.activeElement;
        }
        return lastRoot.getSelection();
      };

      headingCommand.queryState = function () {
        var selection = new scribe.api.Selection();
        return !! selection.getContaining(function (node) {
          return node.nodeName === nodeName;
        });
      };

      /**
       * All: Executing a heading command inside a list element corrupts the markup.
       * Disabling for now.
       */
      headingCommand.queryEnabled = function () {
        var selection = new scribe.api.Selection();
        var listNode = selection.getContaining(function (node) {
          return node.nodeName === 'OL' || node.nodeName === 'UL';
        });

        return scribe.api.Command.prototype.queryEnabled.apply(this, arguments)
          && scribe.allowsBlockElements() && ! listNode;
      };

      scribe.commands[commandName] = headingCommand;
    };
  };

});
