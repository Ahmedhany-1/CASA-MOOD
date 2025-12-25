/**
This file is a modified version of THREE.OrbitControls
Contributors:
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */

/// <reference path="../../lib/three.d.ts" />
/// <reference path="../core/events.ts" />

module BP3D.Three {

  enum ControlsState {
    NONE = -1,
    ROTATE = 0,
    DOLLY = 1,
    PAN = 2,
    TOUCH_ROTATE = 3,
    TOUCH_DOLLY = 4,
    TOUCH_PAN = 5
  }

  export class Controls {
    // Public properties
    public object: THREE.Camera;
    public domElement: HTMLElement | Document;
    public enabled: boolean = true;
    public target: THREE.Vector3 = new THREE.Vector3();
    public center: THREE.Vector3;

    // Zoom settings
    public noZoom: boolean = false;
    public zoomSpeed: number = 1.0;
    public minDistance: number = 0;
    public maxDistance: number = 1500;

    // Rotation settings
    public noRotate: boolean = false;
    public rotateSpeed: number = 1.0;

    // Pan settings
    public noPan: boolean = false;
    public keyPanSpeed: number = 40.0;

    // Auto-rotate settings
    public autoRotate: boolean = false;
    public autoRotateSpeed: number = 2.0;

    // Polar angle limits
    public minPolarAngle: number = 0;
    public maxPolarAngle: number = Math.PI / 2;

    // Key settings
    public noKeys: boolean = false;
    public keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

    // Callbacks
    public cameraMovedCallbacks = new Core.Callbacks();
    public needsUpdate: boolean = true;

    // Private internals
    private static EPS = 0.000001;

    private rotateStart = new THREE.Vector2();
    private rotateEnd = new THREE.Vector2();
    private rotateDelta = new THREE.Vector2();

    private panStart = new THREE.Vector2();
    private panEnd = new THREE.Vector2();
    private panDelta = new THREE.Vector2();

    private dollyStart = new THREE.Vector2();
    private dollyEnd = new THREE.Vector2();
    private dollyDelta = new THREE.Vector2();

    private phiDelta: number = 0;
    private thetaDelta: number = 0;
    private scale: number = 1;
    private panOffset = new THREE.Vector3();

    private state: ControlsState = ControlsState.NONE;

    constructor(object: THREE.Camera, domElement?: HTMLElement) {
      this.object = object;
      this.domElement = domElement !== undefined ? domElement : document;
      this.center = this.target;

      this.initEventListeners();
    }

    private initEventListeners(): void {
      this.domElement.addEventListener('contextmenu', (e) => e.preventDefault(), false);
      this.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e as MouseEvent), false);
      this.domElement.addEventListener('mousewheel', (e) => this.onMouseWheel(e as any), false);
      this.domElement.addEventListener('DOMMouseScroll', (e) => this.onMouseWheel(e as any), false);
      this.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e as TouchEvent), false);
      this.domElement.addEventListener('touchend', () => this.onTouchEnd(), false);
      this.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e as TouchEvent), false);

      window.addEventListener('keydown', (e) => this.onKeyDown(e), false);
    }

    public controlsActive(): boolean {
      return this.state === ControlsState.NONE;
    }

    public setPan(vec3: THREE.Vector3): void {
      this.panOffset = vec3;
    }

    public panTo(vec3: THREE.Vector3): void {
      var newTarget = new THREE.Vector3(vec3.x, this.target.y, vec3.z);
      var delta = this.target.clone().sub(newTarget);
      this.panOffset.sub(delta);
      this.update();
    }

    public rotateLeft(angle?: number): void {
      if (angle === undefined) {
        angle = this.getAutoRotationAngle();
      }
      this.thetaDelta -= angle;
    }

    public rotateUp(angle?: number): void {
      if (angle === undefined) {
        angle = this.getAutoRotationAngle();
      }
      this.phiDelta -= angle;
    }

    public panLeft(distance: number): void {
      var panOffset = new THREE.Vector3();
      var te = this.object.matrix.elements;
      panOffset.set(te[0], 0, te[2]);
      panOffset.normalize();
      panOffset.multiplyScalar(-distance);
      this.panOffset.add(panOffset);
    }

    public panUp(distance: number): void {
      var panOffset = new THREE.Vector3();
      var te = this.object.matrix.elements;
      panOffset.set(te[4], 0, te[6]);
      panOffset.normalize();
      panOffset.multiplyScalar(distance);
      this.panOffset.add(panOffset);
    }

    public pan(delta: THREE.Vector2): void {
      var element = this.domElement === document
        ? (this.domElement as Document).body
        : this.domElement as HTMLElement;

      if ((this.object as THREE.PerspectiveCamera).fov !== undefined) {
        // Perspective camera
        var position = this.object.position;
        var offset = position.clone().sub(this.target);
        var targetDistance = offset.length();
        targetDistance *= Math.tan(((this.object as THREE.PerspectiveCamera).fov / 2) * Math.PI / 180.0);
        this.panLeft(2 * delta.x * targetDistance / element.clientHeight);
        this.panUp(2 * delta.y * targetDistance / element.clientHeight);
      } else if ((this.object as THREE.OrthographicCamera).top !== undefined) {
        // Orthographic camera
        var ortho = this.object as THREE.OrthographicCamera;
        this.panLeft(delta.x * (ortho.right - ortho.left) / element.clientWidth);
        this.panUp(delta.y * (ortho.top - ortho.bottom) / element.clientHeight);
      } else {
        console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
      }

      this.update();
    }

    public panXY(x: number, y: number): void {
      this.pan(new THREE.Vector2(x, y));
    }

    public dollyIn(dollyScale?: number): void {
      if (dollyScale === undefined) {
        dollyScale = this.getZoomScale();
      }
      this.scale /= dollyScale;
    }

    public dollyOut(dollyScale?: number): void {
      if (dollyScale === undefined) {
        dollyScale = this.getZoomScale();
      }
      this.scale *= dollyScale;
    }

    public update(): void {
      var position = this.object.position;
      var offset = position.clone().sub(this.target);

      // Angle from z-axis around y-axis
      var theta = Math.atan2(offset.x, offset.z);

      // Angle from y-axis
      var phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);

      if (this.autoRotate) {
        this.rotateLeft(this.getAutoRotationAngle());
      }

      theta += this.thetaDelta;
      phi += this.phiDelta;

      // Restrict phi to be between desired limits
      phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));

      // Restrict phi to be between EPS and PI-EPS
      phi = Math.max(Controls.EPS, Math.min(Math.PI - Controls.EPS, phi));

      var radius = offset.length() * this.scale;

      // Restrict radius to be between desired limits
      radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

      // Move target to panned location
      this.target.add(this.panOffset);

      offset.x = radius * Math.sin(phi) * Math.sin(theta);
      offset.y = radius * Math.cos(phi);
      offset.z = radius * Math.sin(phi) * Math.cos(theta);

      position.copy(this.target).add(offset);

      this.object.lookAt(this.target);

      this.thetaDelta = 0;
      this.phiDelta = 0;
      this.scale = 1;
      this.panOffset.set(0, 0, 0);

      this.cameraMovedCallbacks.fire();
      this.needsUpdate = true;
    }

    private getAutoRotationAngle(): number {
      return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
    }

    private getZoomScale(): number {
      return Math.pow(0.95, this.zoomSpeed);
    }

    private onMouseDown = (event: MouseEvent): void => {
      if (!this.enabled) return;
      event.preventDefault();

      if (event.button === 0) {
        if (this.noRotate) return;
        this.state = ControlsState.ROTATE;
        this.rotateStart.set(event.clientX, event.clientY);
      } else if (event.button === 1) {
        if (this.noZoom) return;
        this.state = ControlsState.DOLLY;
        this.dollyStart.set(event.clientX, event.clientY);
      } else if (event.button === 2) {
        if (this.noPan) return;
        this.state = ControlsState.PAN;
        this.panStart.set(event.clientX, event.clientY);
      }

      this.domElement.addEventListener('mousemove', this.onMouseMove, false);
      this.domElement.addEventListener('mouseup', this.onMouseUp, false);
    }

    private onMouseMove = (event: MouseEvent): void => {
      if (!this.enabled) return;
      event.preventDefault();

      var element = this.domElement === document
        ? (this.domElement as Document).body
        : this.domElement as HTMLElement;

      if (this.state === ControlsState.ROTATE) {
        if (this.noRotate) return;

        this.rotateEnd.set(event.clientX, event.clientY);
        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

        this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientWidth * this.rotateSpeed);
        this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed);

        this.rotateStart.copy(this.rotateEnd);
      } else if (this.state === ControlsState.DOLLY) {
        if (this.noZoom) return;

        this.dollyEnd.set(event.clientX, event.clientY);
        this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

        if (this.dollyDelta.y > 0) {
          this.dollyIn();
        } else {
          this.dollyOut();
        }

        this.dollyStart.copy(this.dollyEnd);
      } else if (this.state === ControlsState.PAN) {
        if (this.noPan) return;

        this.panEnd.set(event.clientX, event.clientY);
        this.panDelta.subVectors(this.panEnd, this.panStart);

        this.pan(this.panDelta);

        this.panStart.copy(this.panEnd);
      }

      this.update();
    }

    private onMouseUp = (): void => {
      if (!this.enabled) return;

      this.domElement.removeEventListener('mousemove', this.onMouseMove, false);
      this.domElement.removeEventListener('mouseup', this.onMouseUp, false);

      this.state = ControlsState.NONE;
    }

    private onMouseWheel = (event: WheelEvent): void => {
      if (!this.enabled || this.noZoom) return;

      var delta = 0;

      if ((event as any).wheelDelta) {
        delta = (event as any).wheelDelta;
      } else if ((event as any).detail) {
        delta = -(event as any).detail;
      }

      if (delta > 0) {
        this.dollyOut();
      } else {
        this.dollyIn();
      }
      this.update();
    }

    private onKeyDown = (event: KeyboardEvent): void => {
      if (!this.enabled || this.noKeys || this.noPan) return;

      switch (event.keyCode) {
        case this.keys.UP:
          this.pan(new THREE.Vector2(0, this.keyPanSpeed));
          break;
        case this.keys.BOTTOM:
          this.pan(new THREE.Vector2(0, -this.keyPanSpeed));
          break;
        case this.keys.LEFT:
          this.pan(new THREE.Vector2(this.keyPanSpeed, 0));
          break;
        case this.keys.RIGHT:
          this.pan(new THREE.Vector2(-this.keyPanSpeed, 0));
          break;
      }
    }

    private onTouchStart = (event: TouchEvent): void => {
      if (!this.enabled) return;

      switch (event.touches.length) {
        case 1: // One-fingered touch: rotate
          if (this.noRotate) return;
          this.state = ControlsState.TOUCH_ROTATE;
          this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
          break;

        case 2: // Two-fingered touch: dolly
          if (this.noZoom) return;
          this.state = ControlsState.TOUCH_DOLLY;
          var dx = event.touches[0].pageX - event.touches[1].pageX;
          var dy = event.touches[0].pageY - event.touches[1].pageY;
          var distance = Math.sqrt(dx * dx + dy * dy);
          this.dollyStart.set(0, distance);
          break;

        case 3: // Three-fingered touch: pan
          if (this.noPan) return;
          this.state = ControlsState.TOUCH_PAN;
          this.panStart.set(event.touches[0].pageX, event.touches[0].pageY);
          break;

        default:
          this.state = ControlsState.NONE;
      }
    }

    private onTouchMove = (event: TouchEvent): void => {
      if (!this.enabled) return;

      event.preventDefault();
      event.stopPropagation();

      var element = this.domElement === document
        ? (this.domElement as Document).body
        : this.domElement as HTMLElement;

      switch (event.touches.length) {
        case 1: // One-fingered touch: rotate
          if (this.noRotate || this.state !== ControlsState.TOUCH_ROTATE) return;

          this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
          this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

          this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientWidth * this.rotateSpeed);
          this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed);

          this.rotateStart.copy(this.rotateEnd);
          break;

        case 2: // Two-fingered touch: dolly
          if (this.noZoom || this.state !== ControlsState.TOUCH_DOLLY) return;

          var dx = event.touches[0].pageX - event.touches[1].pageX;
          var dy = event.touches[0].pageY - event.touches[1].pageY;
          var distance = Math.sqrt(dx * dx + dy * dy);

          this.dollyEnd.set(0, distance);
          this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

          if (this.dollyDelta.y > 0) {
            this.dollyOut();
          } else {
            this.dollyIn();
          }

          this.dollyStart.copy(this.dollyEnd);
          break;

        case 3: // Three-fingered touch: pan
          if (this.noPan || this.state !== ControlsState.TOUCH_PAN) return;

          this.panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
          this.panDelta.subVectors(this.panEnd, this.panStart);

          this.pan(this.panDelta);

          this.panStart.copy(this.panEnd);
          break;

        default:
          this.state = ControlsState.NONE;
      }
    }

    private onTouchEnd = (): void => {
      if (!this.enabled) return;
      this.state = ControlsState.NONE;
    }
  }
}