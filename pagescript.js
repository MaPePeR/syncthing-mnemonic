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

function bitGroupsToCheckword(bitGroups) {
    'use strict';
    var i, sum = 0;
    for (i = 0; i < bitGroups.length; i++) {
        sum  = (sum + bitGroups[i]) % words.length;
    }
    return words[sum];
}

function deviceIdToWords(deviceId) {
    var unifiedId, bitGroups;
    unifiedId = unifyDeviceId(deviceId);
    bitGroups = deviceIdToBitGroups(unifiedId);
    $('#checkword').val(bitGroupsToCheckword(bitGroups));
    return bitGroups.map(function (v, i, a) {
        return words[v];
    }).join(' ');
}

function wordsToDeviceId(word) {
    var singleWords = word.split(/\s+/);
    var bitGroups = singleWords.map(function (v, i, a) {
        return wordDict[v];
    });
    $('#checkword').val(bitGroupsToCheckword(bitGroups));
    return bitGroupsToDeviceId(bitGroups);
}

function checkWordField(word) {
    var unknownWords = [];
    var singleWords = word.split(/\s+/);
    if (singleWords.length != 24) {
        return 'Need 24 words to convert to a DeviceID (found ' + singleWords.length + ')';
    }
    for (i = 0; i < singleWords.length; i += 1) {
        if (!(singleWords[i] in wordDict)) {
            unknownWords.push(singleWords[i]);
        }
    }
    if (unknownWords.length > 0) {
        return 'Could not parse words: ' + unknownWords.join (', ');
    }
    return false;
}

function checkDeviceIdField(deviceId) {
    try {
        unifyDeviceId(deviceId);
    } catch (e) {
        return e;
    }
    return false;
}

function error(message) {
    'use strict';
    $('#alert_placeholder').html('<div class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><span>' + message + '</span></div>');
}

function warning(message) {
    'use strict';
    $('#alert_placeholder').html('<div class="alert alert-warning alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><span>' + message + '</span></div>');
}

$(document).ready(function () {
    'use strict';
    $('#wordInput').attr('disabled', true);
    $('#wordInput').keyup(function () {
        var word = $('#wordInput').val(), i;

    });
    $('input[name=\'direction\']').change(function () {
        var val = $('input[name=\'direction\']:checked').val();
        $('#alert_placeholder').html('');
        $('#deviceIdFormGroup, #wordInputFormGroup').removeClass('has-error has-success');
        if (val === 'toWords') {
            $('#wordInput').attr('disabled', true);
            $('#deviceId').attr('disabled', false);
        } else if (val === 'toID') {
            $('#wordInput').attr('disabled', false);
            $('#deviceId').attr('disabled', true);
        }
    });
    $('#convertbutton').click(function () {
        var val = $('input[name=\'direction\']:checked').val();
        $('#alert_placeholder').html('');
        var deviceId, word, err;
        try {
            if (val === 'toWords') {
                deviceId = $('#deviceId').val();
                err = checkDeviceIdField(deviceId);
                if (err) {
                    $('#deviceIdFormGroup').addClass('has-error').removeClass('has-success');
                    error(err);
                    $('#wordInput').val('');
                } else {
                    $('#deviceIdFormGroup').addClass('has-success').removeClass('has-error');
                    word = deviceIdToWords(deviceId);
                    $('#wordInput').val(word);
                }
            } else if (val === 'toID') {
                word = $('#wordInput').val();
                err = checkWordField(word);
                if (err) {
                    $('#wordInputFormGroup').addClass('has-error').removeClass('has-success');
                    $('#deviceId').val('');
                    error(err);
                } else {
                    $('#wordInputFormGroup').addClass('has-success').removeClass('has-error');
                    deviceId = wordsToDeviceId(word);
                    $('#deviceId').val(unifiedToOldFormat(deviceId));
                }
            }
        } catch (e) {
            console.log(e);
            error('<strong>Internel Error</strong> ' + e);
        }
    });
});
