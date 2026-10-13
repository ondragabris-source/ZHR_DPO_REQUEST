jQuery.sap.registerModulePath("skoda.ca.pkiredirect", "/sap/bc/ui5_ui5/sap/zca_pkiredirect");
jQuery.sap.require("skoda.ca.pkiredirect.PKIredirect");

sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"ZHR_DPO_REQUEST/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("ZHR_DPO_REQUEST.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			skoda.ca.pkiredirect.PKIredirect.doRedirect();
			
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			
			// enable routing
			this.getRouter().initialize();

			// set the device model
			models.initModel(this);

			this.getModel().read("/AuthStrucSet(DpoRequest='0',Uname='')", {
				success: function (oResult) {
					//var msg = 'Vydani bylo uspesne uvolneno.';
					this.getModel("appModel").setProperty("/MasterRequestSettings", oResult);
				}.bind(this)
			});
		}
	});
});