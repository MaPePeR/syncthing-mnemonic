// jscs:disable maximumLineLength, disallowMultipleVarDecl, requireSpaceAfterLineComment
//http://stackoverflow.com/a/2897510/2256700
(function ($) {
    $.fn.getCursorPosition = function () {
        var input = this.get(0);
        if (!input) {
            return; // No (input) element found
        }
        if ('selectionStart' in input) {
            // Standard-compliant browsers
            return input.selectionStart;
        } else if (document.selection) {
            // IE
            input.focus();
            var sel = document.selection.createRange();
            var selLen = document.selection.createRange().text.length;
            sel.moveStart('character', -input.value.length);
            return sel.text.length - selLen;
        }
    };
})(jQuery);

var words, wordDict = {};
$('#wordFile').load(function () {
    'use strict';
    var i;
    var oFrame = document.getElementById('wordFile');
    var strRawContents = oFrame.contentWindow.document.body.childNodes[0].innerHTML;
    strRawContents = strRawContents.replace('\r', '');
    words = strRawContents.split('\n');
    for (i = 0; i < words.length; i++) {
        wordDict[words[i]] = i;
    }

    new Awesomplete(document.getElementById('wordInput'), {
        list: words,
        autoFirst: true,
        minChars: 2,
        filter: function (text, input) {
            var cursorPos = $(this.input).getCursorPosition();
            var potentialAutocompleteWord = input.substring(0, cursorPos).match(/[^\s]+$/);
            if (!potentialAutocompleteWord) {
                return false;
            }
            return Awesomplete.FILTER_STARTSWITH(text, potentialAutocompleteWord[0]);
        },
        replace: function (text) {
            var cursorPos = $(this.input).getCursorPosition();
            var full = this.input.value;
            var before = full.substring(0, cursorPos);
            before = before.substring(0, before.lastIndexOf(' '));
            this.input.value = (before !== '' ?  before + ' ' : '') + text + ' ' + full.substring(cursorPos);
        }
    });
});

function deviceIdToWords(deviceId) {
    var unifiedId, bitGroups;
    unifiedId = unifyDeviceId(deviceId);
    bitGroups = deviceIdToBitGroups(unifiedId);
    return bitGroups.map(function (v, i, a) {
        return words[v];
    }).join(' ');
}

function wordsToDeviceId(word) {
    var singleWords = word.split(/\s+/);
    var bitGroups = singleWords.map(function (v, i, a) {
        return wordDict[v];
    });
    return bitGroupsToDeviceId(bitGroups);
}

$(document).ready(function () {
    'use strict';
    $('#wordInput').attr('disabled', true);
    $('input[name=\'direction\']').change(function () {
        var val = $('input[name=\'direction\']:checked').val();
        if (val === 'toWords') {
            $('#wordInput').attr('disabled', true);
            $('#deviceid').attr('disabled', false);
        } else if (val === 'toID') {
            $('#wordInput').attr('disabled', false);
            $('#deviceid').attr('disabled', true);
        }
    });
    $('#convertbutton').click(function () {
        var val = $('input[name=\'direction\']:checked').val();
        //$('#alert_placeholder').html('');
        var deviceId, word;
        try {
            if (val === 'toWords') {
                deviceId = $('#deviceid').val();
                word = deviceIdToWords(deviceId);
                $('#wordInput').val(word);
            } else if (val === 'toID') {
                deviceId = wordsToDeviceId($('#wordInput').val());
                $('#deviceid').val(unifiedToOldFormat(deviceId));
            }
        } catch (e) {
            console.log(e);
        }
    });
});
