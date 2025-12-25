/// <reference path="../../lib/three.d.ts" />
/// <reference path="../core/utils.ts" />
/// <reference path="hud.ts" />
/// <reference path="floorplan.ts" />

module BP3D.Three {

  enum ControllerState {
    UNSELECTED = 0,
    SELECTED = 1,
    DRAGGING = 2,
    ROTATING = 3,
    ROTATING_FREE = 4,
    PANNING = 5
  }

  export class Controller {
    public enabled: boolean = true;
    public needsUpdate: boolean = true;

    private three: Main;
    private model: Model.Model;
    private scene: Model.Scene;
    private element: HTMLElement;
    private camera: THREE.PerspectiveCamera;
    private controls: Controls;
    private hud: any;

    private plane: THREE.Mesh;
    private mouse: THREE.Vector2;
    private intersectedObject: Items.Item = null;
    private mouseoverObject: Items.Item = null;
    private selectedObject: Items.Item = null;

    private mouseDown: boolean = false;
    private mouseMoved: boolean = false;
    private rotateMouseOver: boolean = false;

    private state: ControllerState = ControllerState.UNSELECTED;

    constructor(three: Main, model: Model.Model, camera: THREE.PerspectiveCamera, element: HTMLElement, controls: Controls, hud: any) {
      this.three = three;
      this.model = model;
      this.scene = model.scene;
      this.element = element;
      this.camera = camera;
      this.controls = controls;
      this.hud = hud;

      this.mouse = new THREE.Vector2();
      this.plane = this.createGroundPlane();

      this.init();
    }

    private init(): void {
      if (this.element) {
        this.element.addEventListener('mousedown', (e) => this.mouseDownEvent(e));
        this.element.addEventListener('mouseup', (e) => this.mouseUpEvent(e));
        this.element.addEventListener('mousemove', (e) => this.mouseMoveEvent(e));
      }

      this.scene.itemRemovedCallbacks.add((item: Items.Item) => this.itemRemoved(item));
      this.scene.itemLoadedCallbacks.add((item: Items.Item) => this.itemLoaded(item));
    }

    private createGroundPlane(): THREE.Mesh {
      var size = 10000;
      var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial());
      plane.rotation.x = -Math.PI / 2;
      plane.visible = false;
      this.scene.add(plane);
      return plane;
    }

    private itemLoaded(item: Items.Item): void {
      if (!item.position_set) {
        this.setSelectedObject(item);
        this.switchState(ControllerState.DRAGGING);
        var pos = item.position.clone();
        pos.y = 0;
        var vec = this.three.projectVector(pos);
        this.clickPressed(vec);
      }
      item.position_set = true;
    }

    private clickPressed(vec2?: THREE.Vector2): void {
      vec2 = vec2 || this.mouse;
      var intersection = this.itemIntersection(this.mouse, this.selectedObject);
      if (intersection) {
        this.selectedObject.clickPressed(intersection);
      }
    }

    private clickDragged(vec2?: THREE.Vector2): void {
      vec2 = vec2 || this.mouse;
      var intersection = this.itemIntersection(this.mouse, this.selectedObject);
      if (intersection) {
        if (this.isRotating()) {
          this.selectedObject.rotate(intersection);
        } else {
          this.selectedObject.clickDragged(intersection);
        }
      }
    }

    private itemRemoved(item: Items.Item): void {
      if (item === this.selectedObject) {
        this.selectedObject.setUnselected();
        this.selectedObject.mouseOff();
        this.setSelectedObject(null);
      }
    }

    private checkWallsAndFloors(): void {
      if (this.state === ControllerState.UNSELECTED && this.mouseoverObject === null) {
        // Check walls
        var wallEdgePlanes = this.model.floorplan.wallEdgePlanes();
        var wallIntersects = this.getIntersections(this.mouse, wallEdgePlanes, true);
        if (wallIntersects.length > 0) {
          var wall = (wallIntersects[0].object as any).edge;
          this.three.wallClicked.fire(wall);
          return;
        }

        // Check floors
        var floorPlanes = this.model.floorplan.floorPlanes();
        var floorIntersects = this.getIntersections(this.mouse, floorPlanes, false);
        if (floorIntersects.length > 0) {
          var room = (floorIntersects[0].object as any).room;
          this.three.floorClicked.fire(room);
          return;
        }

        this.three.nothingClicked.fire();
      }
    }

    private mouseMoveEvent(event: MouseEvent): void {
      if (!this.enabled) return;
      event.preventDefault();

      this.mouseMoved = true;
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;

      if (!this.mouseDown) {
        this.updateIntersections();
      }

      switch (this.state) {
        case ControllerState.UNSELECTED:
        case ControllerState.SELECTED:
          this.updateMouseover();
          break;
        case ControllerState.DRAGGING:
        case ControllerState.ROTATING:
        case ControllerState.ROTATING_FREE:
          this.clickDragged();
          this.hud.update();
          this.needsUpdate = true;
          break;
      }
    }

    public isRotating(): boolean {
      return this.state === ControllerState.ROTATING || this.state === ControllerState.ROTATING_FREE;
    }

    private mouseDownEvent(event: MouseEvent): void {
      if (!this.enabled) return;
      event.preventDefault();

      this.mouseMoved = false;
      this.mouseDown = true;

      switch (this.state) {
        case ControllerState.SELECTED:
          if (this.rotateMouseOver) {
            this.switchState(ControllerState.ROTATING);
          } else if (this.intersectedObject !== null) {
            this.setSelectedObject(this.intersectedObject);
            if (!this.intersectedObject.fixed) {
              this.switchState(ControllerState.DRAGGING);
            }
          }
          break;
        case ControllerState.UNSELECTED:
          if (this.intersectedObject !== null) {
            this.setSelectedObject(this.intersectedObject);
            if (!this.intersectedObject.fixed) {
              this.switchState(ControllerState.DRAGGING);
            }
          }
          break;
        case ControllerState.DRAGGING:
        case ControllerState.ROTATING:
          break;
        case ControllerState.ROTATING_FREE:
          this.switchState(ControllerState.SELECTED);
          break;
      }
    }

    private mouseUpEvent(event: MouseEvent): void {
      if (!this.enabled) return;
      this.mouseDown = false;

      switch (this.state) {
        case ControllerState.DRAGGING:
          this.selectedObject.clickReleased();
          this.switchState(ControllerState.SELECTED);
          break;
        case ControllerState.ROTATING:
          if (!this.mouseMoved) {
            this.switchState(ControllerState.ROTATING_FREE);
          } else {
            this.switchState(ControllerState.SELECTED);
          }
          break;
        case ControllerState.UNSELECTED:
          if (!this.mouseMoved) {
            this.checkWallsAndFloors();
          }
          break;
        case ControllerState.SELECTED:
          if (this.intersectedObject === null && !this.mouseMoved) {
            this.switchState(ControllerState.UNSELECTED);
            this.checkWallsAndFloors();
          }
          break;
        case ControllerState.ROTATING_FREE:
          break;
      }
    }

    private switchState(newState: ControllerState): void {
      if (newState !== this.state) {
        this.onExit(this.state);
        this.onEntry(newState);
      }
      this.state = newState;
      this.hud.setRotating(this.isRotating());
    }

    private onEntry(state: ControllerState): void {
      switch (state) {
        case ControllerState.UNSELECTED:
          this.setSelectedObject(null);
        // Fall through
        case ControllerState.SELECTED:
          this.controls.enabled = true;
          break;
        case ControllerState.ROTATING:
        case ControllerState.ROTATING_FREE:
          this.controls.enabled = false;
          break;
        case ControllerState.DRAGGING:
          this.three.setCursorStyle("move");
          this.clickPressed();
          this.controls.enabled = false;
          break;
      }
    }

    private onExit(state: ControllerState): void {
      switch (state) {
        case ControllerState.UNSELECTED:
        case ControllerState.SELECTED:
          break;
        case ControllerState.DRAGGING:
          if (this.mouseoverObject) {
            this.three.setCursorStyle("pointer");
          } else {
            this.three.setCursorStyle("auto");
          }
          break;
        case ControllerState.ROTATING:
        case ControllerState.ROTATING_FREE:
          break;
      }
    }

    public getSelectedObject(): Items.Item {
      return this.selectedObject;
    }

    private updateIntersections(): void {
      // Check the rotate arrow
      var hudObject = this.hud.getObject();
      if (hudObject !== null) {
        var hudIntersects = this.getIntersections(this.mouse, hudObject, false, false, true);
        if (hudIntersects.length > 0) {
          this.rotateMouseOver = true;
          this.hud.setMouseover(true);
          this.intersectedObject = null;
          return;
        }
      }
      this.rotateMouseOver = false;
      this.hud.setMouseover(false);

      // Check objects
      var items = this.model.scene.getItems();
      var intersects = this.getIntersections(this.mouse, items, false, true);

      if (intersects.length > 0) {
        this.intersectedObject = intersects[0].object as any;
      } else {
        this.intersectedObject = null;
      }
    }

    private normalizeVector2(vec2: THREE.Vector2): THREE.Vector2 {
      var retVec = new THREE.Vector2();
      retVec.x = ((vec2.x - this.three.widthMargin) / (window.innerWidth - this.three.widthMargin)) * 2 - 1;
      retVec.y = -((vec2.y - this.three.heightMargin) / (window.innerHeight - this.three.heightMargin)) * 2 + 1;
      return retVec;
    }

    private mouseToVec3(vec2: THREE.Vector2): THREE.Vector3 {
      var normVec2 = this.normalizeVector2(vec2);
      var vector = new THREE.Vector3(normVec2.x, normVec2.y, 0.5);
      vector.unproject(this.camera);
      return vector;
    }

    public itemIntersection(vec2: THREE.Vector2, item: Items.Item): THREE.Intersection {
      var customIntersections = item.customIntersectionPlanes();
      var intersections: THREE.Intersection[];
      if (customIntersections && customIntersections.length > 0) {
        intersections = this.getIntersections(vec2, customIntersections, true);
      } else {
        intersections = this.getIntersections(vec2, this.plane);
      }
      if (intersections.length > 0) {
        return intersections[0];
      }
      return null;
    }

    public getIntersections(
      vec2: THREE.Vector2,
      objects: any,
      filterByNormals?: boolean,
      onlyVisible?: boolean,
      recursive?: boolean,
      linePrecision?: number
    ): THREE.Intersection[] {
      // Set defaults for optional parameters
      if (filterByNormals === undefined) filterByNormals = false;
      if (onlyVisible === undefined) onlyVisible = false;
      if (recursive === undefined) recursive = false;
      if (linePrecision === undefined) linePrecision = 20;

      var vector = this.mouseToVec3(vec2);
      var direction = vector.sub(this.camera.position).normalize();
      var raycaster = new THREE.Raycaster(this.camera.position, direction);
      (raycaster as any).linePrecision = linePrecision;

      var intersections: THREE.Intersection[];
      if (Array.isArray(objects)) {
        intersections = raycaster.intersectObjects(objects, recursive);
      } else {
        intersections = raycaster.intersectObject(objects, recursive);
      }

      // Filter by visible
      if (onlyVisible) {
        intersections = Core.Utils.removeIf(intersections, (intersection: THREE.Intersection) => {
          return !intersection.object.visible;
        });
      }

      // Filter by normals
      if (filterByNormals) {
        intersections = Core.Utils.removeIf(intersections, (intersection: THREE.Intersection) => {
          var dot = intersection.face.normal.dot(direction);
          return dot > 0;
        });
      }

      return intersections;
    }

    public setSelectedObject(object: Items.Item): void {
      if (this.state === ControllerState.UNSELECTED) {
        this.switchState(ControllerState.SELECTED);
      }
      if (this.selectedObject !== null) {
        this.selectedObject.setUnselected();
      }
      if (object !== null) {
        this.selectedObject = object;
        this.selectedObject.setSelected();
        this.three.itemSelectedCallbacks.fire(object);
      } else {
        this.selectedObject = null;
        this.three.itemUnselectedCallbacks.fire();
      }
      this.needsUpdate = true;
    }

    private updateMouseover(): void {
      if (this.intersectedObject !== null) {
        if (this.mouseoverObject !== null) {
          if (this.mouseoverObject !== this.intersectedObject) {
            this.mouseoverObject.mouseOff();
            this.mouseoverObject = this.intersectedObject;
            this.mouseoverObject.mouseOver();
            this.needsUpdate = true;
          }
        } else {
          this.mouseoverObject = this.intersectedObject;
          this.mouseoverObject.mouseOver();
          this.three.setCursorStyle("pointer");
          this.needsUpdate = true;
        }
      } else if (this.mouseoverObject !== null) {
        this.mouseoverObject.mouseOff();
        this.three.setCursorStyle("auto");
        this.mouseoverObject = null;
        this.needsUpdate = true;
      }
    }

    public rotatePressed(): void {
      // Placeholder for rotation pressed logic
    }

    public rotateReleased(): void {
      // Placeholder for rotation released logic
    }
  }
}
