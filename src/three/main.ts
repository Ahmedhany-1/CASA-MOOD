/// <reference path="../../lib/three.d.ts" />
/// <reference path="../core/events.ts" />
/// <reference path="../model/model.ts" />
/// <reference path="floorplan.ts" />
/// <reference path="lights.ts" />
/// <reference path="skybox.ts" />
/// <reference path="controls.ts" />
/// <reference path="hud.ts" />
/// <reference path="controller.ts" />

module BP3D.Three {

  export interface MainOptions {
    resize?: boolean;
    pushHref?: boolean;
    spin?: boolean;
    spinSpeed?: number;
    clickPan?: boolean;
    canMoveFixedItems?: boolean;
  }

  export class Main {
    // Public properties
    public element: HTMLElement;
    public controls: Controls;
    public heightMargin: number = 0;
    public widthMargin: number = 0;
    public elementHeight: number = 0;
    public elementWidth: number = 0;

    // Callbacks
    public itemSelectedCallbacks = new Core.Callbacks();
    public itemUnselectedCallbacks = new Core.Callbacks();
    public wallClicked = new Core.Callbacks();
    public floorClicked = new Core.Callbacks();
    public nothingClicked = new Core.Callbacks();

    // Private properties
    private options: MainOptions;
    private scene: Model.Scene;
    private model: Model.Model;
    private domElement: HTMLElement;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controller: Controller;
    private floorplan: any;
    private hud: any;
    private _needsUpdate: boolean = false;
    private lastRender: number = Date.now();
    private mouseOver: boolean = false;
    private hasClicked: boolean = false;

    constructor(model: Model.Model, element: string, canvasElement: string, opts: MainOptions = {}) {
      this.options = {
        resize: true,
        pushHref: false,
        spin: true,
        spinSpeed: 0.00002,
        clickPan: true,
        canMoveFixedItems: false
      };

      // Override with manually set options
      for (var opt in this.options) {
        if (this.options.hasOwnProperty(opt) && opts.hasOwnProperty(opt)) {
          (this.options as any)[opt] = (opts as any)[opt];
        }
      }

      this.model = model;
      this.scene = model.scene;
      this.element = document.getElementById(element.replace('#', ''));

      this.init();
    }

    private init(): void {
      THREE.ImageUtils.crossOrigin = "";

      this.domElement = this.element;
      this.camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true
      });
      this.renderer.autoClear = false;
      (this.renderer as any).shadowMapEnabled = true;
      (this.renderer as any).shadowMapSoft = true;
      (this.renderer as any).shadowMapType = THREE.PCFSoftShadowMap;

      var skybox = new Skybox(this.scene);

      this.controls = new Controls(this.camera, this.domElement);

      this.hud = new HUD(this);

      this.controller = new Controller(
        this, this.model, this.camera, this.element, this.controls, this.hud);

      if (this.domElement) {
        this.domElement.appendChild(this.renderer.domElement);
      }

      // Handle window resizing
      this.updateWindowSize();
      if (this.options.resize) {
        window.addEventListener('resize', () => this.updateWindowSize());
      }

      // Setup camera nicely
      this.centerCamera();
      this.model.floorplan.fireOnUpdatedRooms(() => this.centerCamera());

      var lights = new Lights(this.scene, this.model.floorplan);

      this.floorplan = new Floorplan(this.scene, this.model.floorplan, this.controls);

      this.animate();

      // Mouse event handlers
      if (this.element) {
        this.element.addEventListener('mouseenter', () => {
          this.mouseOver = true;
        });
        this.element.addEventListener('mouseleave', () => {
          this.mouseOver = false;
        });
        this.element.addEventListener('click', () => {
          this.hasClicked = true;
        });
      }
    }

    private spin(): void {
      if (this.options.spin && !this.mouseOver && !this.hasClicked) {
        var theta = 2 * Math.PI * (this.options.spinSpeed || 0) * (Date.now() - this.lastRender);
        this.controls.rotateLeft(theta);
        this.controls.update();
      }
    }

    public dataUrl(): string {
      return this.renderer.domElement.toDataURL("image/png");
    }

    public stopSpin(): void {
      this.hasClicked = true;
    }

    public getOptions(): MainOptions {
      return this.options;
    }

    public getModel(): Model.Model {
      return this.model;
    }

    public getScene(): Model.Scene {
      return this.scene;
    }

    public getController(): Controller {
      return this.controller;
    }

    public getCamera(): THREE.PerspectiveCamera {
      return this.camera;
    }

    public needsUpdate(): void {
      this._needsUpdate = true;
    }

    private shouldRender(): boolean {
      if (this.controls.needsUpdate || this.controller.needsUpdate || this._needsUpdate || this.model.scene.needsUpdate) {
        this.controls.needsUpdate = false;
        this.controller.needsUpdate = false;
        this._needsUpdate = false;
        this.model.scene.needsUpdate = false;
        return true;
      }
      return false;
    }

    private render(): void {
      this.spin();
      if (this.shouldRender()) {
        this.renderer.clear();
        this.renderer.render(this.scene.getScene(), this.camera);
        this.renderer.clearDepth();
        this.renderer.render(this.hud.getScene(), this.camera);
      }
      this.lastRender = Date.now();
    }

    private animate(): void {
      // Use native requestAnimationFrame for smooth 60 FPS rendering
      requestAnimationFrame(() => this.animate());
      this.render();
    }

    public rotatePressed(): void {
      this.controller.rotatePressed();
    }

    public rotateReleased(): void {
      this.controller.rotateReleased();
    }

    public setCursorStyle(cursorStyle: string): void {
      if (this.domElement) {
        this.domElement.style.cursor = cursorStyle;
      }
    }

    public updateWindowSize = (): void => {
      if (!this.element) return;

      var rect = this.element.getBoundingClientRect();
      this.heightMargin = rect.top + window.scrollY;
      this.widthMargin = rect.left + window.scrollX;

      this.elementWidth = this.element.clientWidth;
      if (this.options.resize) {
        this.elementHeight = window.innerHeight - this.heightMargin;
      } else {
        this.elementHeight = this.element.clientHeight;
      }

      this.camera.aspect = this.elementWidth / this.elementHeight;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(this.elementWidth, this.elementHeight);
      this._needsUpdate = true;
    }

    public centerCamera = (): void => {
      var yOffset = 150.0;

      var pan = this.model.floorplan.getCenter();
      pan.y = yOffset;

      this.controls.target = pan;

      var distance = this.model.floorplan.getSize().z * 1.5;

      var offset = pan.clone().add(
        new THREE.Vector3(0, distance, distance));
      this.camera.position.copy(offset);

      this.controls.update();
    }

    public projectVector(vec3: THREE.Vector3, ignoreMargin?: boolean): THREE.Vector2 {
      if (ignoreMargin === undefined) ignoreMargin = false;
      var widthHalf = this.elementWidth / 2;
      var heightHalf = this.elementHeight / 2;

      var vector = new THREE.Vector3();
      vector.copy(vec3);
      vector.project(this.camera);

      var vec2 = new THREE.Vector2();

      vec2.x = (vector.x * widthHalf) + widthHalf;
      vec2.y = -(vector.y * heightHalf) + heightHalf;

      if (!ignoreMargin) {
        vec2.x += this.widthMargin;
        vec2.y += this.heightMargin;
      }

      return vec2;
    }
  }
}