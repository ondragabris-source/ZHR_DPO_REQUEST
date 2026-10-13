sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";
	return {
		initModel: function (oComponent) {
			//Device 
			var oDeviceModel = new JSONModel(Device);
			oDeviceModel.setDefaultBindingMode("OneWay");
			oComponent.setModel(oDeviceModel, "device");


			//Device 
			var oAppModel = new JSONModel();
			oComponent.setModel(oAppModel, "appModel");


		}




	};
});