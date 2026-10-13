sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"ZHR_DPO_REQUEST/lib/utils/Formatter",
	"ZHR_DPO_REQUEST/lib/utils/Constant",
	"ZHR_DPO_REQUEST/lib/utils/Helper",
	"sap/m/UploadCollectionParameter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/ValueState",
	"sap/m/MessageBox",
	"sap/ui/model/odata/ODataUtils",
	"sap/ui/core/BusyIndicator"
], function (Controller,
	Formatter,
	Constant,
	Helper,
	UploadCollectionParameter,
	Filter,
	FilterOperator,
	ValueState,
	MessageBox,
	ODataUtils,
	BusyIndicator
) {
	"use strict";

	return Controller.extend("ZHR_DPO_REQUEST.lib.controller.Base", {
		formatter: Formatter,
		constant: Constant,
		helper: Helper,


		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getOwnerComponent().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getOwnerComponent().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		getEventBus: function () {
			return this.getOwnerComponent().getEventBus();
		},

		getMessageManager: function () {
			return sap.ui.getCore().getMessageManager();
		},

		getMedatadataEntity: function (sEntity) {
			var oEntityType;
			var oMetadata = this.getModel().getServiceMetadata();
			var aEntityType = oMetadata.dataServices.schema[0].entityType;
			aEntityType.forEach(function (oType) {
				if (oType.name === sEntity) {
					oEntityType = oType;
				}
			});

			return oEntityType;
		},

		//ROUTES
		_handleRouteMatchedDetail: async function (oEvent) {
			this.oArgs = oEvent.getParameter("arguments");
			BusyIndicator.show();
			await this.getModel().metadataLoaded();
			BusyIndicator.hide();
			this.bind();
		},

		//BINDING
		_bind: async function (sEntitySet) {
			this.getView().setBusy(true);
			var oResult = await this._callFunction("Init", this.oArgs);
			this.oArgs.Thid = oResult.Thid;
			if (this.oArgs.Thid) {
				this.getView().setBusy(false);
				var sPath = this.getModel().createKey(
					sEntitySet,
					oResult
				);
				this.getView().unbindElement();
				this.getView().bindElement({
					path: sPath,
					events: {
						dataRequested: () => {
							//	console.log(this.getModel().oData);
							this._bRefreshModel = true;
							BusyIndicator.show();
						},
						dataReceived: () => {
							this._bRefreshModel = false;
							BusyIndicator.hide();
						},
					}
				});

				if (!this._bRefreshModel) {
					this._bRefreshModel = false;
					this.getEventBus().publish("refreshDataDetail");
				}
			}
		},

		_openConfirmMessageBox: function (sText) {
			var oDeferred = $.Deferred();
			MessageBox.warning(sText, {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				onClose: function (sAction) {
					oDeferred.resolve(sAction);
				}
			});
			return oDeferred.promise();
		},

		navBack: function (bReplace) {
			this.getOwnerComponent().navBack(bReplace);
		},

		navDirect: function (sSemantic, sRoutePattern, sObject, bBlank) {
			var sUrl = window.location.pathname + window.location.search + "#" + sSemantic + "-display&/" + sRoutePattern + "/" + sObject;
			if (bBlank) {
				window.open(sUrl);
			} else {
				window.location.replace(sUrl);
			}
		},

		//CRUD
		onChangeProp: function () {
			this.saveData();
		},

		saveData: function (sModelName) {
			var oModel = this.getModel(sModelName);
			var oDeferred = $.Deferred();
			$.sap.delayedCall(0, null, function () {
				if (!oModel) {
					return false;
				}
				if (!oModel.hasPendingChanges()) {
					oDeferred.resolve();
				} else {
					sap.ui.core.BusyIndicator.show(2000);
					oModel.submitChanges({
						success: (oResult, oResult2) => {
							oDeferred.resolve(oResult);
						},
						error: function (oError) {
							oDeferred.reject(oError);
						}
					});
					oDeferred.always(function () {
						sap.ui.core.BusyIndicator.hide();
					});
				}
			});
			return oDeferred.promise();
		},

		refreshContext: function (oContext) {
			var oDeferred = $.Deferred();
			if (oContext) {
				var oModel = oContext.getModel();
				oModel.read(oContext.getPath(), {
					success: function () {
						oDeferred.resolve();
					}
				});
			}
			return oDeferred.promise();
		},

		refreshContextDeep: function (oContext) {
			var oDeferred = $.Deferred();
			if (oContext) {
				var oModel = oContext.getModel();
				oModel.read(oContext.sDeepPath, {
					success: function () {
						oDeferred.resolve();
					}
				});
			}
			return oDeferred.promise();
		},

		_callFunction: function (sFunction, oObject, sMethod) {
			var oDeferred = $.Deferred();
			this.getModel().callFunction("/" + sFunction, {
				method: sMethod || "POST",
				urlParameters: oObject,
				success: (oResult) => {
					oDeferred.resolve(oResult[sFunction] || oResult);
				},
				error: oDeferred.reject
			});
			return oDeferred.promise();
		},

		_call: function (sFunction, sPath, oData) {
			var oModel = this.getModel();
			var oDeferred = $.Deferred();

			if ("create") {
				oModel.create(sPath, oData, {
					success: oResult => {
						oDeferred.resolve(oResult);
					},
					error: oDeferred.reject
				});
			}
			return oDeferred.promise();
		},

		//filters
		onFilter: function (oFilterBar, oManageObject, aExtraFilters) {
			oFilterBar = this.getView().byId('filterBar');
			oManageObject = this.getView().byId('table');
			var aFilter = this.getFilterBarFilters(oFilterBar);

			if (aExtraFilters) {
				$.merge(aFilter, aExtraFilters);
			}

			if (oManageObject.getBinding("rows")) {
				oManageObject.getBinding("rows").filter(aFilter);
			}

			if (oManageObject.getBinding("items")) {
				oManageObject.getBinding("items").filter(aFilter);
			}
		},
		
		filter: function (oFilterBar, oManageObject, aExtraFilters) {

			var aFilter = this.getFilterBarFilters(oFilterBar);

			if (aExtraFilters) {
				$.merge(aFilter, aExtraFilters);
			}

			if (oManageObject.getBinding("rows")) {
				oManageObject.getBinding("rows").filter(aFilter);
			}

			if (oManageObject.getBinding("items")) {
				oManageObject.getBinding("items").filter(aFilter);
			}
		},

		getFilterBarFilters: function (oFilterBar) {
			var aFilterGroupItems = oFilterBar.getFilterGroupItems();
			var aFilters = [];

			//operator and value conversion
			aFilterGroupItems.forEach(oFilterGroupItem => {
				var oControl = oFilterGroupItem.getControl();
				var aValues = [];
				if (oControl instanceof sap.m.Input || (oControl instanceof sap.m.StepInput && oControl.getValue())) {
					aValues.push(oControl.getValue());
				}

				if (/*oControl instanceof sap.m.ComboBox || */oControl instanceof sap.m.Select) {
					aValues.push(oControl.getSelectedKey());
				}

				aValues.forEach(sValue => {
					if (sValue) {
						aFilters.push(new Filter(oFilterGroupItem.getName(), this.getOperator(sValue), this.parseValue(sValue)));
					}

				});

				if (oControl instanceof sap.m.DatePicker) {
					if (oControl.getDateValue() && oControl.getSecondDateValue()) {
						aFilters.push(new Filter(oFilterGroupItem.getName(), FilterOperator.GE, oControl.getDateValue().toISOString().substring(0, 10).replaceAll("-","")));
						aFilters.push(new Filter(oFilterGroupItem.getName(), FilterOperator.LE, oControl.getSecondDateValue().toISOString().substring(0, 10).replaceAll("-","")));
					}

				}

				if (oControl instanceof sap.m.ComboBox) {
					var aMultiComboBoxFiler = [];
					[oControl.getSelectedKey()].forEach(sKey => {
						if(sKey != ""){
						aFilters.push(new Filter(oFilterGroupItem.getName(), FilterOperator.EQ, sKey));
						}
					});
				}

			});

			return aFilters;
		},

		getOperator: function (sValue) {
			return $.isNumeric(sValue) ? FilterOperator.EQ : FilterOperator.EQ;
		},

		parseValue: function (sValue) {
			return $.isNumeric(sValue) ? parseInt(sValue) : sValue;
		},

		validateForm: function (oForm) {
			var bValid = true;
			var aFormContainers = oForm.getFormContainers();
			aFormContainers.forEach(oFormContainer => {
				oFormContainer.getFormElements().forEach(oFormElement => {
					if (oFormElement.getLabel().getRequired() && oFormElement.getVisible()) {
						oFormElement.getFields().forEach(oField => {

							if (!this.validateField(oField)) {
								bValid = false;
							}
						});
					}

				})
			});

			return bValid;
		},

		validateField: function (oField) {
			var bValid = true;
			if (oField.setValueState) {
				oField.setValueState(ValueState.None)
			}

			if (oField instanceof sap.m.Input || oField instanceof sap.m.TextArea) {
				if (!oField.getValue()) {
					bValid = false;
					oField.setValueState(ValueState.Error);
				}
			}

			if (oField instanceof sap.m.ComboBox) {
				if (!oField.getSelectedKey()) {
					bValid = false;
					oField.setValueState(ValueState.Error);
				}
			}
			return bValid;
		},

		exportExcel: function (oEvent, aSelect) {
			var oTable = oEvent.getSource().getParent().getParent();
			var oBinding = oTable.getBinding("rows");
			var aFilters = oBinding.aFilters;
			var oEntityType = this.getModel().oMetadata._getEntityTypeByPath(oBinding.getPath());
			var sFilterParams = "";
			if (aFilters.length) {
				sFilterParams = ODataUtils.createFilterParams(aFilters, this.getModel().oMetadata, oEntityType);
			}

			var sUrl = "/sap/opu/odata/sap/" + oEntityType.namespace + oBinding.getPath() + "?" + sFilterParams +
				"$skip=0&$top=10000000&$format=xlsx";

			if (aSelect && aSelect.length) {
				sUrl = sUrl + "&$select=" + aSelect.toString();
			}

			sap.m.URLHelper.redirect(sUrl, true)
		},

		onBeforeUploadStarts: function (oEvent, sDokar) {
			var oUploader = oEvent.getSource();
			var oParameter = oEvent.getParameters();
			var oContext = oEvent.getSource().getBindingContext();
			var sThid = oContext.getProperty("Thid");
			var sDescr = "";
			oUploader.setBusy(true);

			this.getModel("appModel").getProperty("/uploadFiles").forEach(oFile => {
				if (oFile.name === oEvent.getParameter("fileName")) {
					sDescr = oFile.Descr;
				}
			});

			oParameter.addHeaderParameter(new UploadCollectionParameter({
				name: "Dokar",
				value: encodeURI(sDokar)
			}));

			oParameter.addHeaderParameter(new UploadCollectionParameter({
				name: "Thid",
				value: encodeURI(sThid)
			}));

			oParameter.addHeaderParameter(new UploadCollectionParameter({
				name: "Descr",
				value: encodeURI(sDescr)
			}));

			oEvent.getParameters().addHeaderParameter(new UploadCollectionParameter({
				name: "slug",
				value: encodeURI(oEvent.getParameter("fileName"))
			}));

			oEvent.getParameters().addHeaderParameter(new UploadCollectionParameter({
				name: "x-csrf-token",
				value: oEvent.getSource().getModel().getSecurityToken()
			}));
		},

		onUploadComplete: function (oEvent) {
			var oUploader = oEvent.getSource();
			var oHeaders = oEvent.getParameters().getParameter("headers");
			oUploader.setBusy(false);
			oUploader.getBinding("items").refresh();
			this.getModel().refreshSecurityToken();
			this.getModel("appModel").setProperty("/uploadFiles", []);
		},

		/**
		 * @see sap.ui.unified.FileUploader.html#event:fileSizeExceed
		 */
		onFileSizeExceed: function (oEvent) {
			var oUploader = oEvent.getSource();
			var oBundle = this.getResourceBundle();
		},

		/**
		 * @see sap.ui.unified.FileUploader.html#event:typeMissmatch
		 */
		onTypeMissmatch: function (oEvent) {
			var oBundle = this.getResourceBundle();
		},

		/**
		 * @see sap.ui.unified.FileUploader.html#event:filenameLengthExceed
		 */
		onFilenameLengthExceed: function (oEvent) {
			var oUploader = oEvent.getSource();
			var oBundle = this.getResourceBundle();
		},

		setPanelTextCount: function (oEvent, sIdPanel, sId) {
			var iCount = oEvent.getSource().getLength();
			var oPanel = this.byId(sIdPanel);
			oPanel.setHeaderText(this.getResourceBundle().getText(sId) + " (" + iCount + ")");
		},
		
		onLiveChangeCheckIsNumber: function (oEvent) {
			var PersonId = oEvent.getSource().getValue();
			if (!this.isNumeric(PersonId)) {
				oEvent.getSource().setValueState("Error");
				oEvent.getSource().setValueStateText("Zadejte PERNR.");
				oEvent.getSource().getParent().getParent().getParent().getParent().getBeginButton().setEnabled(false);
			} else {
				oEvent.getSource().setValueState("None");
				oEvent.getSource().setValueStateText("");
				oEvent.getSource().getParent().getParent().getParent().getParent().getBeginButton().setEnabled(true);
			}
		},

		isNumeric: function (str) {
			if (typeof str != "string") return false; // we only process strings!  
			return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
				!isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
		},
		
		getBooleanFromString: function (str) {
			str = str.toLowerCase();
			if ( str == "" || str == "false") return false; // we only process strings!  
			else return true; 
		},
		
		utf8_to_b64: function(str) {
			return window.btoa(unescape(encodeURIComponent(str)));
		},

		b64_to_utf8: function(str) {
			return decodeURIComponent(escape(window.atob(str)));
		},

		onCloseDialog: function (oEvent) {
			oEvent.getSource().getParent().close();
		},

		onDestroyDialog: function (oEvent) {
			oEvent.getSource().getParent().destroy();
		}
	});
});