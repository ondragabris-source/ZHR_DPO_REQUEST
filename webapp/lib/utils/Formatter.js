sap.ui.define(["ZHR_DPO_REQUEST/lib/utils/Constant", "sap/ui/core/ValueState", "sap/ui/core/IconColor"], function(e, r, t) {
    "use strict";
    return {
        constant: e,
        getUrlForA004: function(e) {
            return "/sap/opu/odata/sap/ZHR_DPO_A004_SRV/PdfSet(DpoRequest='1')/$value"
        },
        ifNotSameReturnSecondValue: function(e, r) {
            if (e == null) return;
            if (e != r) {
                return r
            } else {
                return ""
            }
        },
        returnTrueIfLastCharIsNotD: function(e) {
            if (!e) return false;
            var r = e.slice(-1);
            if (r == "D" || r == "d") {
                return false
            } else return true
        },
        returnTrueIfA004: function(e) {
            if (e == "OZ01") {
                return true
            } else return false
        },
        removeLeadingZeros: function(e) {
            if (e) {
                return parseInt(e, 10)
            }
            return e
        },
        toIntPom: function(e) {
            if (e) {
                return parseInt(e)
            }
            return e
        },
        getBoolAsYesNo: function(e) {
            if (e == "true") {
                return "Ano"
            } else return "Ne"
        },
        getBoolIcon: function(e) {
            if (e == "X") {
                return "sap-icon://accept"
            } else {
                return "sap-icon://decline"
            }
        },
        formatDateCanReturnNull: function(e) {
            if (e == "" || e == null) return e;
            if (e == "0000-00-00") return "";
            if (e instanceof Date) {
                return "1.1.1999"
            }
            var r = e.substring(0, 4);
            var t = e.substring(5, 7);
            var n = e.substring(8, 10);
            var u = new Date(r, t - 1, n);
            return n + "." + t + "." + r
        },
        formatDate: function(e) {
            if (e == "" || e == null) return e;
            if (e instanceof Date) {
                return "1.1.1999"
            }
            var r = e.substring(0, 4);
            var t = e.substring(4, 6);
            var n = e.substring(6, 8);
            var u = new Date(r, t - 1, n);
            return n + "." + t + "." + r
        },
        formatTypeOfRow: function(e, r, t) {
            return r;
            if (t == null) return;
            if (t == "1" || t == 1) {
                return r
            } else {
                return ""
            }
        },
        getBooleanCustom: function(e) {
            if (e == "X") {
                return true
            } else {
                return false
            }
        },
        getRequiredAttchText: function(e) {
            if (e != "" && e != null) {
                return e.split("//")[1]
            } else return "Wrong paremeters are set in Z table. Please contact administrator about this error"
        },
        getUrlToRequiredAttch: function(e) {
            if (e != "" && e != null) {
                return "/sap/bc/ui5_ui5/sap/" + e.split("//")[0] + "/index.html?requestid=2"
            } else return "Wrong paremeters are set in Z table. Please contact administrator about this error"
        },
        getNoneIfNull: function(e) {
            if (e == "" || e == null || e == " ") {
                return "None"
            } else return e
        },
        getStatusIcon(r) {
            var t = "sap-icon://circle-task-2";
            var n = {};
            switch (r) {
                case e.MPOP:
                    r = "sap-icon://delete";
                    break;
                case e.MPPO:
                    r = "sap-icon://delete";
                    break;
                case e.MPEX:
                    r = "technical-object";
                    break;
                case e.VYRA:
                    r = "technical-object";
                    break;
                case e.SKLA:
                    r = "technical-object";
                    break;
                case e.ZALO:
                    r = "technical-object";
                    break;
                case e.PROV:
                    r = "technical-object";
                    break;
                case e.SMAZ:
                    r = "technical-object";
                    break;
                default:
                    break
            }
            return t
        },
        falseIfZad_Next: function(e) {
            if (e == "ZAD_NEXT") {
                return false
            } else {
                return true
            }
        },
        falseIfZad_NextOrProgressiveApprovalOff: function(e, r) {
            if (e == "ZAD_NEXT") {
                return false
            } else {
                if (r == true) {
                    return true
                } else return false
            }
        },
        returnNullIf999: function(e) {
            if (e == "999") {
                return ""
            } else {
                return e
            }
        },
        getBooleanFromString(e) {
            if (e == "true") {
                return true
            } else if (e == "false") {
                return false
            } else {
                return false
            }
        },
        checkIfIsNotEmpty(e) {
            if (e == "" || e == null) return false;
            else return true
        },
        formateDateToString: function(e) {
            if (typeof e === "string" && e.length === 10 && e.charAt(4) === "-" && e.charAt(7) === "-") {
                var r = e.split("-");
                return e === "0000-00-00" ? "" : r[2] + "." + r[1] + "." + r[0]
            }
            var t = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: "dd.MM.yyyy"
            });
            var n = t.format(e);
            return n
        },
        formateTimeToString(e) {
            function r(e, r) {
                r = r || 2;
                return ("00" + e).slice(-r)
            }
            if (e) {
                e = e.ms
            }
            var t = e % 1e3;
            e = (e - t) / 1e3;
            var n = e % 60;
            e = (e - n) / 60;
            var u = e % 60;
            var a = (e - u) / 60;
            return r(a) + ":" + r(u)
        },
        formateTimeToStringOrDigital(e, r) {
            function t(e, r) {
                r = r || 2;
                return ("00" + e).slice(-r)
            }
            if (r == "999") {
                return "Elektronicky"
            }
            if (e) {
                e = e.ms
            }
            var n = e % 1e3;
            e = (e - n) / 1e3;
            var u = e % 60;
            e = (e - u) / 60;
            var a = e % 60;
            var i = (e - a) / 60;
            return t(i) + ":" + t(a)
        },
        decode(e) {
            return decodeURI(e)
        },
        visibleIfNotNull(e) {
            if (e != null && e != "") return true;
            return false
        },
        determineVisible(e, r) {
            if (e == "D-DOHODA") {
                switch (r) {
                    case "AgreementSection":
                        return true;
                        break;
                    case "WritingSection":
                        return false;
                        break;
                    default:
                        return false;
                        break
                }
            }
            if (e == "P-CENTR") {
                switch (r) {
                    case "AgreementSection":
                        return false;
                        break;
                    case "WritingSection":
                        return true;
                        break;
                    case "Tasks":
                        return true;
                        break;
                    default:
                        return false;
                        break
                }
            } else {
                return false
            }
        },
        getStringFromInputOrNone: function(e) {
            if (e == "") {
                return "None"
            } else {
                return "Success"
            }
        },
        falseIfAgreement: function(e) {
            if (e == "Dohody") {
                return false
            } else {
                return true
            }
        },
        getBooleanFromString: function(e) {
            if (e == undefined) return false;
            e = e.toLowerCase();
            if (e == "" || e == "false") return false;
            else return true
        },
        getBooleanFromStringA004Case: function(e, r, t, n) {
            if (e === undefined || e === null) return false;
            e = e.toString().toLowerCase();
            if (e === "" || e === "false" && t !== "SP") return false;
            else if (r) return false;
            var u = typeof n === "undefined" || n;
            if (e === "true" && u) return true;
            if (e === "false" && t === "SP" && u) return true;
            return false
        },
        getBooleanFromStringA004Case2: function(e, r, t) {
            if (e == undefined) return false;
            e = e.toString();
            e = e.toLowerCase();
            if (e == "" || e == "false" && t != "SP") return false;
            else if (r) return false;
            else if (e == "true" && t != "SP") return false;
            else if (e == "false" && t == "SP") return true;
            return false
        },
        returnReverseBool: function(e) {
            if (e) {
                return false
            }
            return true
        }
    }
});