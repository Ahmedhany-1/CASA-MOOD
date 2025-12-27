/*
 * CASA MOOD - Professional Interior Design Studio
 * Main Application Logic
 */

/*
 * Camera Buttons
 */
var CameraButtons = function (blueprint3d) {
  var orbitControls = blueprint3d.three.controls;
  var three = blueprint3d.three;
  var panSpeed = 30;

  var directions = {
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
  };

  function init() {
    $("#zoom-in").click(zoomIn);
    $("#zoom-out").click(zoomOut);
    $("#zoom-in").dblclick(preventDefault);
    $("#zoom-out").dblclick(preventDefault);
    $("#reset-view").click(three.centerCamera);

    // Camera presets
    $("#view-perspective").click(function (e) {
      e.preventDefault();
      three.centerCamera();
    });

    $("#view-top").click(function (e) {
      e.preventDefault();
      // Top-down view
      if (orbitControls && orbitControls.object) {
        orbitControls.object.position.set(0, 1500, 0);
        orbitControls.target.set(0, 0, 0);
        orbitControls.update();
      }
    });

    $("#view-front").click(function (e) {
      e.preventDefault();
      // Front view
      if (orbitControls && orbitControls.object) {
        orbitControls.object.position.set(0, 300, 1500);
        orbitControls.target.set(0, 0, 0);
        orbitControls.update();
      }
    });
  }

  function preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function zoomIn(e) {
    e.preventDefault();
    orbitControls.dollyIn(1.1);
    orbitControls.update();
  }

  function zoomOut(e) {
    e.preventDefault();
    orbitControls.dollyOut(1.1);
    orbitControls.update();
  }

  init();
};

/*
 * Context menu for selected item
 */
var ContextMenu = function (blueprint3d) {
  var scope = this;
  var selectedItem;
  var three = blueprint3d.three;

  function init() {
    $("#context-menu-delete").click(function (event) {
      selectedItem.remove();
    });

    three.itemSelectedCallbacks.add(itemSelected);
    three.itemUnselectedCallbacks.add(itemUnselected);

    initResize();

    $("#fixed").click(function () {
      var checked = $(this).prop('checked');
      selectedItem.setFixed(checked);
    });

    // Close properties panel
    $("#close-properties").click(function () {
      $("#right-sidebar").removeClass("open");
    });
  }

  function cmToIn(cm) {
    return cm / 2.54;
  }

  function inToCm(inches) {
    return inches * 2.54;
  }

  function itemSelected(item) {
    selectedItem = item;
    $("#context-menu-name").text(item.metadata.itemName);

    // Show dimensions in cm (original was inches)
    $("#item-width").val(selectedItem.getWidth().toFixed(0));
    $("#item-height").val(selectedItem.getHeight().toFixed(0));
    $("#item-depth").val(selectedItem.getDepth().toFixed(0));

    $("#context-menu").show();
    $("#right-sidebar").addClass("open");
    $("#fixed").prop('checked', item.fixed);
  }

  function resize() {
    selectedItem.resize(
      parseFloat($("#item-height").val()),
      parseFloat($("#item-width").val()),
      parseFloat($("#item-depth").val())
    );
  }

  function initResize() {
    $("#item-height").change(resize);
    $("#item-width").change(resize);
    $("#item-depth").change(resize);
  }

  function itemUnselected() {
    selectedItem = null;
    $("#context-menu").hide();
  }

  init();
};

/*
 * Loading modal for items
 */
var ModalEffects = function (blueprint3d) {
  var scope = this;
  var itemsLoading = 0;

  this.setActiveItem = function (active) {
    update();
  };

  function update() {
    if (itemsLoading > 0) {
      $("#loading-modal").addClass("show");
    } else {
      $("#loading-modal").removeClass("show");
    }
  }

  function init() {
    blueprint3d.model.scene.itemLoadingCallbacks.add(function () {
      itemsLoading += 1;
      update();
    });

    blueprint3d.model.scene.itemLoadedCallbacks.add(function () {
      itemsLoading -= 1;
      update();
    });

    update();
  }

  init();
};

/*
 * Budget Tracker
 */
var BudgetTracker = function (blueprint3d) {
  var totalBudget = 0;
  var itemPrices = {};

  // Price lookup from model URL (will be populated from items catalog)
  var priceByModelUrl = {};

  function init() {
    // Build price lookup table from items catalog after it loads
    setTimeout(function () {
      buildPriceLookup();
    }, 500);

    blueprint3d.model.scene.itemLoadedCallbacks.add(function (item) {
      var price = item.metadata.price || 0;
      // If no price in metadata, try to look it up by model URL
      if (price === 0 && item.metadata.modelUrl && priceByModelUrl[item.metadata.modelUrl]) {
        price = priceByModelUrl[item.metadata.modelUrl];
        item.metadata.price = price; // Store it for future reference
      }
      if (price > 0) {
        itemPrices[item.uuid] = price;
        updateTotal();
      }
    });

    blueprint3d.model.scene.itemRemovedCallbacks.add(function (item) {
      if (itemPrices[item.uuid]) {
        delete itemPrices[item.uuid];
        updateTotal();
      }
    });

    // Recalculate budget when a design is loaded
    blueprint3d.model.roomLoadedCallbacks.add(function () {
      // Clear existing prices and recalculate after items are loaded
      setTimeout(function () {
        recalculateAllItems();
      }, 1000); // Wait for items to finish loading
    });
  }

  function buildPriceLookup() {
    // Scan all product cards and build a price lookup by model URL
    $(".product-card.add-item").each(function () {
      var modelUrl = $(this).attr("data-model-url");
      var price = parseFloat($(this).attr("data-price")) || 0;
      if (modelUrl && price > 0) {
        priceByModelUrl[modelUrl] = price;
      }
    });
    console.log("BudgetTracker: Built price lookup for", Object.keys(priceByModelUrl).length, "items");
  }

  function recalculateAllItems() {
    // Clear existing prices
    itemPrices = {};

    // Get all items in the scene
    var items = blueprint3d.model.scene.getItems();
    items.forEach(function (item) {
      var price = item.metadata.price || 0;
      // Try to look up price by model URL
      if (price === 0 && item.metadata.modelUrl && priceByModelUrl[item.metadata.modelUrl]) {
        price = priceByModelUrl[item.metadata.modelUrl];
        item.metadata.price = price;
      }
      if (price > 0) {
        itemPrices[item.uuid] = price;
      }
    });

    updateTotal();
    console.log("BudgetTracker: Recalculated budget for", items.length, "items, total:", totalBudget);
  }

  function updateTotal() {
    totalBudget = 0;
    for (var key in itemPrices) {
      totalBudget += itemPrices[key];
    }
    $("#total-budget").text(totalBudget.toLocaleString('en-EG') + ' EGP');
  }

  init();
};

/*
 * Side menu / Tab Navigation
 */
var SideMenu = function (blueprint3d, floorplanControls, modalEffects) {
  var ACTIVE_CLASS = "active";

  var tabs = {
    "FLOORPLAN": $("#floorplan_tab"),
    "SHOP": $("#items_tab"),
    "DESIGN": $("#design_tab")
  };

  var scope = this;
  this.stateChangeCallbacks = $.Callbacks();

  this.states = {
    "DEFAULT": {
      "div": $("#viewer"),
      "tab": tabs.DESIGN
    },
    "FLOORPLAN": {
      "div": $("#floorplanner"),
      "tab": tabs.FLOORPLAN
    },
    "SHOP": {
      "div": $("#viewer"), // Keep 3D view visible while browsing catalog
      "tab": tabs.SHOP
    }
  };

  var currentState = scope.states.FLOORPLAN;

  function init() {
    for (var tab in tabs) {
      var elem = tabs[tab];
      elem.click(tabClicked(elem));
    }

    $("#update-floorplan").click(floorplanUpdate);

    initLeftMenu();

    blueprint3d.three.updateWindowSize();
    handleWindowResize();

    initItems();

    setCurrentState(scope.states.DEFAULT);
  }

  function floorplanUpdate() {
    setCurrentState(scope.states.DEFAULT);
  }

  function tabClicked(tab) {
    return function () {
      blueprint3d.three.stopSpin();

      for (var key in scope.states) {
        var state = scope.states[key];
        if (state.tab == tab) {
          setCurrentState(state);
          break;
        }
      }
    };
  }

  function setCurrentState(newState) {
    if (currentState == newState) {
      return;
    }

    // Update tab styling
    if (currentState.tab !== newState.tab) {
      if (currentState.tab != null) {
        currentState.tab.removeClass(ACTIVE_CLASS);
        currentState.tab.removeClass("bg-emerald-50 text-emerald-600");
        currentState.tab.addClass("text-gray-600");
      }
      if (newState.tab != null) {
        newState.tab.addClass(ACTIVE_CLASS);
        newState.tab.addClass("bg-emerald-50 text-emerald-600");
        newState.tab.removeClass("text-gray-600");
      }
    }

    blueprint3d.three.getController().setSelectedObject(null);

    // Handle floorplanner visibility
    if (newState == scope.states.FLOORPLAN) {
      $("#floorplanner").addClass("active").show();
      $("#viewer").hide();
      floorplanControls.updateFloorplanView();
      floorplanControls.handleWindowResize();
    } else {
      $("#floorplanner").removeClass("active").hide();
      $("#viewer").show();
    }

    if (currentState == scope.states.FLOORPLAN) {
      blueprint3d.model.floorplan.update();
    }

    if (newState == scope.states.DEFAULT || newState == scope.states.SHOP) {
      blueprint3d.three.updateWindowSize();
    }

    handleWindowResize();
    currentState = newState;

    scope.stateChangeCallbacks.fire(newState);
  }

  function initLeftMenu() {
    $(window).resize(handleWindowResize);
    handleWindowResize();
  }

  function handleWindowResize() {
    // Calculate available height (window - header)
    var headerHeight = 60;
    var availableHeight = window.innerHeight - headerHeight;

    // Left sidebar fills available height
    $("#left-sidebar").height(availableHeight);

    // Main viewport fills remaining space
    $("#main-viewport").height(availableHeight);
  }

  function initItems() {
    console.log("Initializing item click handlers...");

    // Use document-level event delegation for dynamically added product cards
    $(document).on("click", ".product-card.add-item", function (e) {
      e.preventDefault();
      e.stopPropagation();

      var $card = $(this);
      var modelUrl = $card.attr("data-model-url");
      var itemType = parseInt($card.attr("data-model-type"));
      var itemName = $card.attr("data-model-name");

      console.log("Product card clicked:", itemName);
      console.log("Model URL:", modelUrl);
      console.log("Item Type:", itemType);

      var itemPrice = parseFloat($card.attr("data-price"));

      if (!modelUrl) {
        return;
      }

      var metadata = {
        itemName: itemName,
        resizable: true,
        modelUrl: modelUrl,
        itemType: itemType,
        price: itemPrice
      };

      blueprint3d.model.scene.addItem(itemType, modelUrl, metadata);

      // Switch to 3D view after adding item
      setCurrentState(scope.states.DEFAULT);
    });

    console.log("Item click handlers initialized.");
  }

  init();
};

/*
 * Change floor and wall textures
 */
var TextureSelector = function (blueprint3d, sideMenu) {
  var scope = this;
  var three = blueprint3d.three;
  var currentTarget = null;

  function initTextureSelectors() {
    $(".texture-select-thumbnail").click(function (e) {
      var textureUrl = $(this).attr("texture-url");
      var textureStretch = ($(this).attr("texture-stretch") == "true");
      var textureScale = parseInt($(this).attr("texture-scale"));
      currentTarget.setTexture(textureUrl, textureStretch, textureScale);
      e.preventDefault();
    });
  }

  function init() {
    three.wallClicked.add(wallClicked);
    three.floorClicked.add(floorClicked);
    three.itemSelectedCallbacks.add(reset);
    three.nothingClicked.add(reset);
    sideMenu.stateChangeCallbacks.add(reset);
    initTextureSelectors();
  }

  function wallClicked(halfEdge) {
    currentTarget = halfEdge;
    $("#floorTexturesDiv").hide();
    $("#wallTextures").show();
    $("#right-sidebar").addClass("open");
  }

  function floorClicked(room) {
    currentTarget = room;
    $("#wallTextures").hide();
    $("#floorTexturesDiv").show();
    $("#right-sidebar").addClass("open");
  }

  function reset() {
    $("#wallTextures").hide();
    $("#floorTexturesDiv").hide();
  }

  init();
};

/*
 * Floorplanner controls
 */
var ViewerFloorplanner = function (blueprint3d) {
  var canvasWrapper = '#floorplanner';
  var move = '#move';
  var remove = '#delete';
  var draw = '#draw';

  this.floorplanner = blueprint3d.floorplanner;
  var scope = this;

  function init() {
    $(window).resize(scope.handleWindowResize);
    scope.handleWindowResize();

    var defaultStyle = 'bg-white border-gray-300 text-gray-700';
    var activeStyleClass = 'bg-emerald-600 text-white border-emerald-600';

    scope.floorplanner.modeResetCallbacks.add(function (mode) {
      // Reset all buttons to default state
      $(draw).removeClass(activeStyleClass).addClass(defaultStyle);
      $(remove).removeClass(activeStyleClass).addClass(defaultStyle);
      $(move).removeClass(activeStyleClass).addClass(defaultStyle);

      if (mode == BP3D.Floorplanner.floorplannerModes.MOVE) {
        $(move).removeClass(defaultStyle).addClass(activeStyleClass);
      } else if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
        $(draw).removeClass(defaultStyle).addClass(activeStyleClass);
      } else if (mode == BP3D.Floorplanner.floorplannerModes.DELETE) {
        $(remove).removeClass(defaultStyle).addClass(activeStyleClass);
      }

      if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
        $("#draw-walls-hint").show();
        scope.handleWindowResize();
      } else {
        $("#draw-walls-hint").hide();
      }
    });

    $(move).click(function () {
      scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.MOVE);
    });

    $(draw).click(function () {
      scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DRAW);
    });

    $(remove).click(function () {
      scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DELETE);
    });
  }

  this.updateFloorplanView = function () {
    scope.floorplanner.reset();
  };

  this.handleWindowResize = function () {
    var headerHeight = 60;
    $(canvasWrapper).height(window.innerHeight - headerHeight);
    scope.floorplanner.resizeView();
  };

  init();
};

/*
 * Main Controls (Save/Load/New)
 */
var mainControls = function (blueprint3d) {
  function newDesign() {
    blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
  }

  function loadDesign() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.CasaMood,.json';
    input.onchange = function (e) {
      var file = e.target.files[0];
      var reader = new FileReader();
      reader.onload = function (event) {
        blueprint3d.model.loadSerialized(event.target.result);
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function saveDesign() {
    var data = blueprint3d.model.exportSerialized();
    var a = window.document.createElement('a');
    var blob = new Blob([data], { type: 'application/json' });
    a.href = window.URL.createObjectURL(blob);
    a.download = 'design.CasaMood';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function exportPDF() {
    // Export the 3D view as an image
    try {
      var dataUrl = blueprint3d.three.dataUrl();
      var link = document.createElement('a');
      link.download = 'design-export.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Could not export: Please switch to 3D View first.');
    }
  }

  function init() {
    $("#save-project").click(saveDesign);
    $("#load-project").click(loadDesign);
    $("#export-pdf").click(exportPDF);
  }

  init();
};

/*
 * Initialize Application
 */
$(document).ready(function () {
  // Blueprint3D configuration
  var opts = {
    floorplannerElement: 'floorplanner-canvas',
    threeElement: '#viewer',
    textureDir: "models/textures/",
    widget: false
  };

  var blueprint3d = new BP3D.Blueprint3d(opts);
  window.blueprint3d = blueprint3d;

  // Initialize all modules
  var modalEffects = new ModalEffects(blueprint3d);
  var viewerFloorplanner = new ViewerFloorplanner(blueprint3d);
  var contextMenu = new ContextMenu(blueprint3d);
  var sideMenu = new SideMenu(blueprint3d, viewerFloorplanner, modalEffects);
  window.sideMenu = sideMenu;
  var textureSelector = new TextureSelector(blueprint3d, sideMenu);
  var cameraButtons = new CameraButtons(blueprint3d);
  var budgetTracker = new BudgetTracker(blueprint3d);
  mainControls(blueprint3d);

  // Load default room
  blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
});
