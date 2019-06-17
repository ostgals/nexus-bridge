
var NBPR = (function () {

  function initializeNexus(options) {
    var pm = this.GetPM();
    var appletName = pm.Get('GetName');
    var isPopup = pm.Get('IsPopup');
    SiebelAppFacade.NB = SiebelAppFacade.NB || {};
    if (isPopup) {
      var popupPM = SiebelApp.S_App.GetPopupPM();
      var isShuttle = popupPM.Get('isPopupMVGAssoc');
      var mvgAssoc = popupPM.Get('MVGAssocAppletObject');
      var applet = SiebelApp.S_App.GetActiveView().GetApplet(appletName)
      var isMvgAssoc = isShuttle && applet && applet === mvgAssoc;
      SiebelAppFacade.NB[appletName] =
        SiebelAppFacade.N19Helper.CreatePopupNB(Object.assign(
          { pm: pm, isMvgAssoc: isMvgAssoc, isPopup: true }, options
        ));
    } else {
      SiebelAppFacade.NB[appletName] =
        new SiebelAppFacade.N19Helper(Object.assign({ pm: pm }, options));
    }
    return SiebelAppFacade.NB[appletName];
  }

  function destroyNexus() {
    var appletName = this.GetPM().Get('GetName');
    if (SiebelAppFacade.NB && SiebelAppFacade.NB[appletName]) {
      SiebelAppFacade.NB[appletName] = null;
      delete SiebelAppFacade.NB[appletName];
    }
  }

  function removeHtml() {
    var divId = "s_" + this.GetPM().Get('GetFullId') + "_div";
    var el = document.querySelector('#' + divId + ' > *');
    if (el) { // can't be found for assoc in shuttle when mvg html removed
      el.parentNode.removeChild(el);
    }
  }

  function setControlValue(control, value) {
    var pm = this.GetPM();
    var obj = pm.Get('n19internal');
    obj[control.GetName()] = value;
    pm.AddProperty('n19internal', obj)
  }

  function getPhysicalControlValue(control) {
    var pm = this.GetPM();
    pm.AddProperty('PhysicalCtrlVal', '');
    if (control) {
      var val = pm.Get('n19internal')[control.GetName()];
      pm.AddProperty('PhysicalCtrlVal', val);
    }
  }

  function initInternalObject() {
    var pm = this.GetPM();
    var obj = {};
    var selection = pm.Get('GetSelection');
    if (selection > -1) {
      var controls = pm.Get('GetControls');
      // TODO: better for list; form returns not formatted? should we handle it?
      var recordSet = pm.Get('GetRecordSet')[selection];
      if (recordSet) { // TODO: is it better to check is in query?
        Object.keys(controls).forEach(function (controlName) {
          //TODO: should we use formatted field value?
          var fieldName = controls[controlName].GetFieldName();
          if ('' !== fieldName) {
            obj[controlName] = recordSet[fieldName];
          }
        });
      }
    }
    pm.AddProperty('n19internal', obj);
  }

  function init() {
    var pm = this.GetPM();
    pm.AddProperty('n19internal', {});
    pm.AttachNotificationHandler(consts.get('SWE_PROP_BC_NOTI_END'), initInternalObject.bind(this));
    this.AttachPMBinding("FieldChange", setControlValue);
    this.AttachPMBinding("GetPhysicalControlValue", getPhysicalControlValue);
  }

  return {
    initializeNexus: initializeNexus,
    destroyNexus: destroyNexus,
    removeHtml: removeHtml,
    init: init
  };
}());
