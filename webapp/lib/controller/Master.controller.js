sap.ui.define(
	["ZHR_DPO_REQUEST/lib/controller/Base.controller",
		"ZHR_DPO_REQUEST/lib/utils/Formatter",
		"sap/m/ListMode",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator"
	],
	function (Controller,
		Formatter,
		ListMode,
		Filter,
		FilterOperator) {
		"use strict";

		return Controller.extend("ZHR_DPO_REQUEST.lib.controller.Master", {
			oFormatter: Formatter,
			onInit: function () {
			},
			
			onFilter: function (oEvent) {
				this.filter(oEvent.getSource(), this.byId("table"));
			},

			onSearch: function (oEvent) {
				this.filter(oEvent.getSource(), this.byId("table"));
			},

			onRowSelectionChange: function (oEvent) {
			},

			onDataRequestedMasterTable: function (oEvent) {
				var oSource = this.byId("table");
				oSource.setBusy(true);
			},
			
			onDataReceivedMasterTableDoNothing: function (oEvent) {
				var oSource = this.byId("table");
				oSource.setBusy(false);
			},

			onDataReceivedMasterTable: function (oEvent) {
				var oSource = this.byId("table");
				oSource.setBusy(false);
				var iCount = oEvent.getSource().getLength();
				var oTableTitle = this.byId("tableTitle");
				oTableTitle.setText(this.getResourceBundle().getText("tableTitle") + " (" + iCount + ")");
			},

			onPressEdit: function (oEvent) {
				var oContext = oEvent.getSource().getBindingContext();
				this.getMessageManager().removeAllMessages();
				this.getRouter().navTo("detail", oContext.getObject());
			},

			onPressClose: function () {
				this.getRouter().navTo("master", null, true);
				this.byId("table").clearSelection();
			},

			onPressAddOrder: function (oEvent) {
				this.openDialogAddOrder(oEvent);
			},

			onPressAddPlan: function (oEvent) {
				this.openDialogAddPlan(oEvent);
			},

			//FILTERS ValueHelps
			onPressValueHelpRequestTplnrVal: function (oEvent) {
				this.openDialogValueHelp(oEvent, ListMode.SingleSelectMaster, true, "/LocationSHSet", "Tplnr", ["Tplnr", "Pltxt"]);
			},

			onPressValueHelpRequestEqartVal: function (oEvent) {
				var aFilters = [new Filter("CodelistId", FilterOperator.EQ, "Eqart")];
				var aColumns = ["CodelistValue"];
				if (this.getModel("appModel").getProperty("/GetSettings/ShowTechNames")) {
					aColumns.push("CodelistKey");
				}
				this.openDialogValueHelp(oEvent, ListMode.SingleSelectMaster, true, "/CodeListSet", "CodelistKey", aColumns, null, aFilters, true);
			},

			onPressValueHelpRequestZzBuildingGisVal: function (oEvent) {
				this.openDialogValueHelp(oEvent, ListMode.SingleSelectMaster, true, "/BuildingSHSet", "Fid", ["Fid", "Nazev"]);
			},

			onPressValueHelpRequestZzRoomGisVal: function (oEvent) {
				this.openDialogValueHelp(oEvent, ListMode.SingleSelectMaster, true, "/RoomSHSet", "Fidm", ["Fidm", "Nazev"]);
			},

			onPressValueHelpRequestAdminPernrVal: function (oEvent) {
				this.openDialogValueHelp(oEvent, ListMode.SingleSelectMaster, true, "/EmployeeSHSet", "Pernr", ["Pernr", "Ename", "Bukrs", "Kostl",
					"Orgtx"
				]);
			},

			onPressValueHelpRequestRespPernrVal: function (oEvent) {
				this.openDialogValueHelp(oEvent, ListMode.SingleSelectMaster, true, "/EmployeeSHSet", "Pernr", ["Pernr", "Ename", "Bukrs", "Kostl",
					"Orgtx"
				]);
			},

			onPressValueHelpRequestQmnamPernrVal: function (oEvent) {
				this.openDialogValueHelp(oEvent, ListMode.SingleSelectMaster, true, "/EmployeeSHSet", "Pernr", ["Pernr", "Ename", "Bukrs", "Kostl",
					"Orgtx"
				]);
			},

			onPressValueHelpRequestSplitPernrVal: function (oEvent) {
				this.openDialogValueHelp(oEvent, ListMode.SingleSelectMaster, true, "/EmployeeSHSet", "Pernr", ["Pernr", "Ename", "Bukrs", "Kostl",
					"Orgtx"
				]);
			},

			onPressValueHelpRequestArbplVal: function (oEvent) {
				this.openDialogValueHelp(oEvent, ListMode.SingleSelectMaster, false, "/WorkCenterSHSet", "Arbpl", ["Arbpl", "Ktext", "Stand"
				]);
			},

			onPressValueHelpRequestOrgehVal: function (oEvent) {
				//key="{OwnerOrgeh}" valueHelpKey="Orgeh" valueHelpText="Orgtx" valueHelpPath="/OrgUnitSHSet"
				this.openDialogValueHelp(oEvent, ListMode.SingleSelectMaster, true, "/OrgUnitSHSet", "Orgeh", ["Orgeh", "Orgtx"]);
			},

			onPressValueHelpRequestEqunrVal: function (oEvent) {
				this.openDialogValueHelp(oEvent, ListMode.SingleSelectMaster, true, "/EquipmentSHSet", "Equnr", ["Equnr", "Eqktx", "EqartText", "EqtypText"]);
			},

			onPressValueHelpRequestKostlVal: function (oEvent) {
				this.openDialogValueHelp(oEvent, ListMode.SingleSelectMaster, true, "/CostCenterSHSet", "Kostl", ["Kostl", "Ltext"]);
			}
		});
	}
);