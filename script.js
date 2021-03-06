// jscs:disable maximumLineLength, disallowMultipleVarDecl, requireSpaceAfterLineComment

var base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
var base32map = {};
(function init() {
    'use strict';
    var i;
    for (i = base32chars.length - 1; i >= 0; i -= 1) {
        base32map[base32chars[i]] = i;
    }
}());

function removeCharactersFromString(s, indexes) {
    var out = '', i, ilast;
    for (i = 0; i < indexes.length; i += 1) {
        out += s.substring(ilast, indexes[i]);
        ilast = indexes[i] + 1;
    }
    out += s.substring(ilast);
    return out;
}

//P56IOI-7MZJNU-2IQGDR-EYDM2M-GTMGL3-BXNPQ6-W5BTBB-Z4TJXZ-WICQ
//P56IOI7-MZJNU2Y-IQGDREY-DM2MGTI-MGL3BXN-PQ6W5BM-TBBZ4TJ-XZWICQ2
//aaaaaaa-aaaaaaA-bbbbbbb-bbbbbbB-ccccccc-ccccccC-ddddddd-ddddddD
var longDeviceIdPattern = /^[A-Z2-7]{56}$/;
var unifiedDeviceIdPattern = /^[A-Z2-7]{52}$/;
function unifyDeviceId(id) {
    'use strict';
    var unified, unifiedWithChecks;
    id = id.replace(/[-\s]/g, '').replace(/0/g, 'O').replace(/1/g, 'I').replace(/8/g, 'B').toUpperCase();
    if (id.length === 56 && id.match(longDeviceIdPattern)) {
        //New Device id
        unified = removeCharactersFromString(id, [1 * 13, 1 + 2 * 13, 2 + 3 * 13, 3 + 4 * 13]);
        unifiedWithChecks = unifiedToNewFormatWithoutDashes(unified);
        if (id !== unifiedWithChecks) {
            throw "Checksum in DeviceID indicated an error!";
        }
        return unified;
    } else if (id.length === 52 && id.match(unifiedDeviceIdPattern)) {
        return id;
    } else {
        throw 'Cannot parse DeviceID!';
    }
}

function isUnifiedId(id) {
    'use strict';
    return id.match(unifiedDeviceIdPattern);
}

function checkUnifiedId(unifiedId) {
    'use strict';
    if (!isUnifiedId(unifiedId)) {
        throw unifiedId + 'Is not a unified Id';
    }
}

function groupWithDashes(s, groups) {
    'use strict';
    var out = '', sum = 0, i;
    for (i = 0; i < groups.length - 1; i += 1) {
        out += s.substring(sum, sum + groups[i]) + '-';
        sum += groups[i];
    }
    return out + s.substring(sum, sum + groups[groups.length - 1]);
}

function unifiedToOldFormat(unifiedId) {
    'use strict';
    checkUnifiedId(unifiedId);
    return groupWithDashes(unifiedId, [6, 6, 6, 6, 6, 6, 6, 6, 4]);
}

function luhnGenerateBase32(s) {
    //Source: https://github.com/calmh/luhn/blob/0c8388ff95fa92d4094011e5a04fc99dea3d1632/luhn.go#L21-L47
    'use strict';
    var i, sum = 0, codepoint, addend, remainder, factor = 1, n = base32chars.length;
    for (i = 0; i < s.length; i += 1) {
		if (!(s[i] in base32map))  {
			throw "unknown character " + s[i];
		}
        codepoint = base32map[s[i]];
		addend = factor * codepoint;
		if (factor == 2) {
			factor = 1;
		} else {
			factor = 2;
		}
		addend = Math.floor(addend / n) + (addend % n);
		sum += addend;
	}
    remainder = sum % n
	return  base32chars[(n - remainder) % n]
}

function unifiedToNewFormatWithoutDashes(unifiedId) {
    //Source: https://github.com/syncthing/protocol/blob/f9132cae85dcda1caba2f4ba78996d348b00ac6c/deviceid.go#L109-L124
    'use strict';
    var i, group, out = "", check;
    checkUnifiedId(unifiedId);
    for (i = 0; i < 4; i += 1) {
        group = unifiedId.substring(i*13, (i+1)*13);
        check = luhnGenerateBase32(group);
        out += "" + group + check;
    }
    return out;
}

function unifiedToNewFormat(unifiedId) {
    'use strict';
    var s = unifiedToNewFormatWithoutDashes(unifiedId);
    return groupWithDashes(s, [7, 7, 7, 7, 7, 7, 7, 7]);
}

function getBitFromBase32(unifiedId, n) {
    'use strict';
    return getBit(n, 5, function getGroupFromBase32String(whichGroup) {
        return base32map[unifiedId[whichGroup] || 'A'];
    });
}

function getBit(n, groupsize, getGroup) {
    'use strict';
    var whichGroup = Math.floor(n / groupsize), group = getGroup(whichGroup);
    //console.log('getBit(' + n + ', ' + groupsize +'). CharId = ' + whichGroup + ' group = ' + group);
    //Shift group to the right, so the interesting bit is at the rightmost postion
    group = (group >> (groupsize - 1 - (n % groupsize)));
    return (group & 1) > 0;
}

function regroupBits(oldgroupsize, newgroupsize, oldgroupcount, getGroup, appendGroup) {
    'use strict';
    if (oldgroupcount * oldgroupsize % newgroupsize !== 0) {
        throw 'Cannot group ' + oldgroupcount + ' * ' + oldgroupsize + ' into groups of ' + newgroupsize;
    }
    return regroupBitsWithZeroPadding(oldgroupsize, newgroupsize, oldgroupcount, oldgroupcount * oldgroupsize / newgroupsize,  getGroup, appendGroup);
}

function regroupBitsWithZeroPadding(oldgroupsize, newgroupsize, oldgroupcount, newgroupcount, getGroup, appendGroup) {
    'use strict';
    var i, j, outgroups, group;
    for (i = 0; i < newgroupcount; i += 1) {
        group = 0;
        for (j = 0; j < newgroupsize; j += 1) {
            if (getBit(i * newgroupsize + j, oldgroupsize, getGroup)) {
                group |= (1 << (newgroupsize - j - 1));
            }
        }
        outgroups = appendGroup(outgroups, group);
    }
    return outgroups;
}

function appendOrCreateGroupList(oldGroups, group) {
    'use strict';
    if (oldGroups === undefined) {
        return [group];
    } else {
        oldGroups.push(group);
        return oldGroups;
    }
}

function makeGetGroupForBrackets(groups) {
    'use strict';
    return function (whichGroup) {
        return groups[whichGroup];
    };
}

function makeGetGroupForBase32(base64) {
    'use strict';
    return function getGroupFromBase32String(whichGroup) {
        return base32map[base64[whichGroup] || 'A'];
    };
}

function deviceIdToBitGroups(unifiedId) {
    'use strict';
    checkUnifiedId(unifiedId);
    //Group DeviceID to 8-bit groups, so we can calculate an additonal checksum byte.
    var i, sum = 0, byteGroups = regroupBitsWithZeroPadding(5, 8, unifiedId.length, 256 / 8, makeGetGroupForBase32(unifiedId), appendOrCreateGroupList);
    for (i = 0; i < byteGroups.length; i += 1) {
        sum = (sum + byteGroups[i]) & 0xFF;
    }
    byteGroups.push(sum);
    //byteGroups now has 256 + 8 = 264 = 11 * 24 bits
    return regroupBits(8, 11, byteGroups.length, makeGetGroupForBrackets(byteGroups), appendOrCreateGroupList);
}

function bitGroupsToDeviceId(groups) {
    'use strict';
    function appendWithBase32Char(oldGroups, group) {
        if (oldGroups === undefined) {
            return base32chars[group];
        } else {
            return oldGroups + base32chars[group];
        }
    }
    var i, sum = 0, groupOf8 = regroupBits(11, 8, groups.length, makeGetGroupForBrackets(groups), appendOrCreateGroupList);
    for (i = 0; i < groupOf8.length - 1; i += 1) {
        sum = (sum + groupOf8[i]) & 0xFF;
    }
    if (sum !== groupOf8[groupOf8.length - 1]) {
        throw 'Checksum did not match!';
    }
    groupOf8[groupOf8.length - 1] = 0;
    return regroupBitsWithZeroPadding(8, 5, groupOf8.length - 1, Math.ceil(256 / 5), makeGetGroupForBrackets(groupOf8), appendWithBase32Char);
}
