sap.ui.define(["ZHR_DPO_REQUEST/lib/utils/Constant", "sap/ui/core/ValueState", "sap/ui/core/IconColor"], function(r, t) {
    "use strict";
    return {

        getBoolIcon: function(oInput) {
            if (oInput == "X") {
                return "sap-icon://accept";
            } else {
                return "sap-icon://decline";
            }
        },

        ifNotSameReturnSecondValue: function(oInput1, oInput2) {
            if (oInput1 == null) return;
            if (oInput1 != oInput2) {
                //return oInput1 + " " + oInput2;
                return oInput2;
            } else {
                return "";
            }
        },

        formatDateCanReturnNull: function(oInput) {
            if (oInput == "" || oInput == null) return oInput;
            if (oInput instanceof Date) {
                return '1.1.1999'
            }
            var year = oInput.substring(0, 4);
            var month = oInput.substring(4, 6);
            var day = oInput.substring(6, 8);

            var date = new Date(year, month - 1, day);

            return day + "." + month + "." + year;
        },

        removeLeadingZeros: function(oInput) {

            if (oInput) {
                return parseInt(oInput, 10);
            }
            return oInput;
        },

        returnReverseBool: function(oInput) {

            if (oInput) {
                if (oInput == "false") return true;
                else return true;
            }
            return false;
        },

        toIntPom: function(oInput) {
            //<Text text="{TermService>Ordernr}" wrapping="false"/>
            if (oInput) {
                return parseInt(oInput);
            }
            return oInput;
        },

        formatDate: function(oInput) {
            if (oInput == "" || oInput == null) return oInput;
            if (oInput instanceof Date) {
                return '1.1.1999'
            }
            var year = oInput.substring(0, 4);
            var month = oInput.substring(4, 6);
            var day = oInput.substring(6, 8);

            var date = new Date(year, month - 1, day);

            return day + "." + month + "." + year;
        },

        formatTypeOfRow: function(oInput1, oInput2, oInput3) {
            return oInput2;
            if (oInput3 == null) return;
            if (oInput3 == "1" || oInput3 == 1) {
                //return oInput1 + " " + oInput2;
                return oInput2;
            } else {
                return "";
            }
        },

        getBooleanCustom: function(oInput) {
            if (oInput == "X") {
                return true;
            } else {
                return false;
            }
        },




        falseIfAgreement: function(oInput) {
            if (oInput == "Dohody") {
                return true;
            } else {
                return false;
            }
        },

        returnNullIf999: function(oInput) {
            if (oInput == "999") {
                return "";
            } else {
                return oInput;
            }
        },

        falseIfZad_Next: function(oInput) {
            if (oInput == "ZAD_NEXT") {
                return false;
            } else {
                return true;
            }
        },

        formateDateToString: function(r) {
			if (!r) {
                return r
            }
            var t = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: "dd.MM.yyyy"
            });
            var e = t.format(r);
            return e;
        },
        formateTimeToString: function(r) {
            function t(r, t) {
                t = t || 2;
                return ("00" + r).slice(-t);
            }
            if (r) {
                r = r.ms;
            }
            var e = r % 1e3;
            r = (r - e) / 1e3;
            var n = r % 60;
            r = (r - n) / 60;
            var a = r % 60;
            var u = (r - a) / 60;
            return t(u) + ":" + t(a);
        },
        returnTrueIfASP: function(r) {
            if (r == "ASP") {
                return true;
            } else {
                return false;
            }
        }
    };
});