// CASA MOOD - Egyptian Furniture Catalog
// Products from local Egyptian brands with EGP pricing

$(document).ready(function () {
  var items = [
    // ========== In & Out Furniture (Modern) ==========
    {
      "name": "Milano Sectional Sofa",
      "brand": "In & Out Furniture",
      "price": 45000,
      "category": "living",
      "image": "models/thumbnails/thumbnail_rochelle-sofa-3.jpg",
      "model": "models/js/cb-rochelle-gray_baked.js",
      "type": "1"
    },
    {
      "name": "Roma Accent Chair",
      "brand": "In & Out Furniture",
      "price": 12500,
      "category": "living",
      "image": "models/thumbnails/thumbnail_tn-orange.png",
      "model": "models/js/ik-ekero-orange_baked.js",
      "type": "1"
    },
    {
      "name": "Venezia Armchair",
      "brand": "In & Out Furniture",
      "price": 15800,
      "category": "living",
      "image": "models/thumbnails/thumbnail_ekero-blue3.png",
      "model": "models/js/ik-ekero-blue_baked.js",
      "type": "1"
    },

    // ========== Hubu (Contemporary) ==========
    {
      "name": "Nordic Coffee Table",
      "brand": "Hubu",
      "price": 8900,
      "category": "living",
      "image": "models/thumbnails/thumbnail_stockholm-coffee-table__0181245_PE332924_S4.JPG",
      "model": "models/js/ik-stockholmcoffee-brown.js",
      "type": "1"
    },
    {
      "name": "Oslo Side Table",
      "brand": "Hubu",
      "price": 4500,
      "category": "living",
      "image": "models/thumbnails/thumbnail_Screen_Shot_2014-02-21_at_1.24.58_PM.png",
      "model": "models/js/GUSossingtonendtable.js",
      "type": "1"
    },
    {
      "name": "Stockholm Media Console",
      "brand": "Hubu",
      "price": 18500,
      "category": "living",
      "image": "models/thumbnails/thumbnail_clapboard-white-60-media-console-1.jpg",
      "model": "models/js/cb-clapboard_baked.js",
      "type": "1"
    },
    {
      "name": "Bergen Media Unit",
      "brand": "Hubu",
      "price": 22000,
      "category": "living",
      "image": "models/thumbnails/thumbnail_moore-60-media-console-1.jpg",
      "model": "models/js/cb-moore_baked.js",
      "type": "1"
    },
    {
      "name": "Copenhagen Bookshelf",
      "brand": "Hubu",
      "price": 14200,
      "category": "living",
      "image": "models/thumbnails/thumbnail_kendall-walnut-bookcase.jpg",
      "model": "models/js/cb-kendallbookcasewalnut_baked.js",
      "type": "1"
    },

    // ========== Kabbanery (Wardrobes & Storage) ==========
    {
      "name": "Premium Wardrobe White",
      "brand": "Kabbanery",
      "price": 28000,
      "category": "bedroom",
      "image": "models/thumbnails/thumbnail_TN-ikea-kvikine.png",
      "model": "models/js/ik-kivine_baked.js",
      "type": "1"
    },
    {
      "name": "Madera 6-Drawer Dresser",
      "brand": "Kabbanery",
      "price": 19500,
      "category": "bedroom",
      "image": "models/thumbnails/thumbnail_matera_dresser_5.png",
      "model": "models/js/DWR_MATERA_DRESSER2.js",
      "type": "1"
    },
    {
      "name": "Slim Dresser White",
      "brand": "Kabbanery",
      "price": 12800,
      "category": "bedroom",
      "image": "models/thumbnails/thumbnail_img25o.jpg",
      "model": "models/js/we-narrow6white_baked.js",
      "type": "1"
    },
    {
      "name": "Teak Storage Trunk",
      "brand": "Kabbanery",
      "price": 7500,
      "category": "living",
      "image": "models/thumbnails/thumbnail_teca-storage-trunk.jpg",
      "model": "models/js/cb-tecs_baked.js",
      "type": "1"
    },

    // ========== Damietta Workshop (Classic Handcrafted) ==========
    {
      "name": "Classic Oak Dining Chair",
      "brand": "Damietta Workshop",
      "price": 3800,
      "category": "kitchen",
      "image": "models/thumbnails/thumbnail_Church-Chair-oak-white_1024x1024.jpg",
      "model": "models/js/gus-churchchair-whiteoak.js",
      "type": "1"
    },
    {
      "name": "Heritage Dining Table",
      "brand": "Damietta Workshop",
      "price": 35000,
      "category": "kitchen",
      "image": "models/thumbnails/thumbnail_scholar-dining-table.jpg",
      "model": "models/js/cb-scholartable_baked.js",
      "type": "1"
    },
    {
      "name": "Artisan Chef Table",
      "brand": "Damietta Workshop",
      "price": 42000,
      "category": "kitchen",
      "image": "models/thumbnails/thumbnail_Screen_Shot_2014-01-28_at_6.49.33_PM.png",
      "model": "models/js/BlakeAvenuejoshuatreecheftable.js",
      "type": "1"
    },
    {
      "name": "Olive Sectional Damietta",
      "brand": "Damietta Workshop",
      "price": 55000,
      "category": "damietta",
      "image": "models/thumbnails/thumbnail_img21o.jpg",
      "model": "models/js/we-crosby2piece-greenbaked.js",
      "type": "1"
    },

    // ========== Bedroom Essentials ==========
    {
      "name": "Nordli Full Bed",
      "brand": "Hubu",
      "price": 24000,
      "category": "bedroom",
      "image": "models/thumbnails/thumbnail_nordli-bed-frame__0159270_PE315708_S4.JPG",
      "model": "models/js/ik_nordli_full.js",
      "type": "1"
    },
    {
      "name": "Shale Bedside Table",
      "brand": "Hubu",
      "price": 5200,
      "category": "bedroom",
      "image": "models/thumbnails/thumbnail_Blu-Dot-Shale-Bedside-Table.jpg",
      "model": "models/js/bd-shalebedside-smoke_baked.js",
      "type": "1"
    },
    {
      "name": "Arch Nightstand White",
      "brand": "Kabbanery",
      "price": 4800,
      "category": "bedroom",
      "image": "models/thumbnails/thumbnail_arch-white-oval-nightstand.jpg",
      "model": "models/js/cb-archnight-white_baked.js",
      "type": "1"
    },

    // ========== Lighting & Decor ==========
    {
      "name": "Tripod Floor Lamp",
      "brand": "In & Out Furniture",
      "price": 6500,
      "category": "living",
      "image": "models/thumbnails/thumbnail_ore-white.png",
      "model": "models/js/ore-3legged-white_baked.js",
      "type": "1"
    },
    {
      "name": "Geometric Blue Rug",
      "brand": "Hubu",
      "price": 8200,
      "category": "living",
      "image": "models/thumbnails/thumbnail_cb-blue-block60x96.png",
      "model": "models/js/cb-blue-block-60x96.js",
      "type": "8"
    },
    {
      "name": "Cairo Art Print",
      "brand": "In & Out Furniture",
      "price": 2500,
      "category": "living",
      "image": "models/thumbnails/thumbnail_nyc2.jpg",
      "model": "models/js/nyc-poster2.js",
      "type": "2"
    },

    // ========== Doors & Windows ==========
    {
      "name": "Classic Panel Door",
      "brand": "Kabbanery",
      "price": 4200,
      "category": "kitchen",
      "image": "models/thumbnails/thumbnail_Screen_Shot_2014-10-27_at_8.04.12_PM.png",
      "model": "models/js/closed-door28x80_baked.js",
      "type": "7"
    },
    {
      "name": "French Door Open",
      "brand": "Kabbanery",
      "price": 5500,
      "category": "kitchen",
      "image": "models/thumbnails/thumbnail_Screen_Shot_2014-10-27_at_8.22.46_PM.png",
      "model": "models/js/open_door.js",
      "type": "7"
    },
    {
      "name": "Double-Pane Window",
      "brand": "Kabbanery",
      "price": 3800,
      "category": "kitchen",
      "image": "models/thumbnails/thumbnail_window.png",
      "model": "models/js/whitewindow.js",
      "type": "3"
    }
  ];

  // Format price in EGP
  function formatPrice(price) {
    return price.toLocaleString('en-EG') + ' EGP';
  }

  // Render product cards
  var itemsDiv = $("#items-wrapper");

  function renderProducts(filter) {
    itemsDiv.empty();

    var filteredItems = filter === 'all'
      ? items
      : items.filter(function (item) { return item.category === filter; });

    for (var i = 0; i < filteredItems.length; i++) {
      var item = filteredItems[i];
      var html = '<div class="product-card add-item" ' +
        'data-model-name="' + item.name + '" ' +
        'data-model-url="' + item.model + '" ' +
        'data-model-type="' + item.type + '" ' +
        'data-price="' + item.price + '">' +
        '<img src="' + item.image + '" alt="' + item.name + '" loading="lazy">' +
        '<div class="product-info">' +
        '<div class="product-name">' + item.name + '</div>' +
        '<div class="product-brand">' + item.brand + '</div>' +
        '<div class="product-price">' + formatPrice(item.price) + '</div>' +
        '</div></div>';
      itemsDiv.append(html);
    }
  }

  // Initial render
  renderProducts('all');

  // Category filter handlers
  $('.category-pill').click(function () {
    $('.category-pill').removeClass('active');
    $(this).addClass('active');
    var category = $(this).data('category');
    renderProducts(category);
  });

  // Search functionality
  $('#product-search').on('input', function () {
    var query = $(this).val().toLowerCase();
    $('.product-card').each(function () {
      var name = $(this).attr('model-name').toLowerCase();
      var brand = $(this).find('.product-brand').text().toLowerCase();
      if (name.includes(query) || brand.includes(query)) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  });
});