var DrugBank = function(){
    if (!Detector.webgl) Detector.addGetWebGLMessage();

    var container = document.getElementById('container');
    var config, gui, stats;
    var camera, scene, renderer;
    var particleSystems = {};
    var axisHelper;
    var mouseX = 0, mouseY = 0;
    var dragging = false;

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;
    var dx = 0, dy = 0;
    var offset = 2.0;

    var texture = null;
    var relations, relationSystems = {};
    var vertices = {};

    config = new function() {
        this.stats = false;
    };

    init(container, window.innerWidth, window.innerHeight);
    animate();

    function createRelationSystem(objects){
        var geometry = new THREE.Geometry();

        for (var i=0; i<objects.length; i++) {
            var vertex = vertices[objects[i]];
            geometry.vertices.push(vertex);
        }
        //geometry.computeBoundingSphere();

        var material = new THREE.LineBasicMaterial({ 
            color: 0xaaaaaa, transparent: true, depthTest: true, linewidth: 0.1,
            blending: THREE.AdditiveBlending
        });

        lines = new THREE.Line(geometry, material);
        lines.rotation.y = -Math.PI / 2;
        return lines;
    }

    function createParticleSystem(objects, color, offset){
        var geometry = new THREE.Geometry();

        for (var i=0; i<objects.length; i++) {
            // positions
            var vertex = new THREE.Vector3(+objects[i][2], +objects[i][3], offset);
            geometry.vertices.push(vertex);
            vertices[objects[i][0]] = vertex;
        }
        geometry.computeBoundingSphere();

        var material = new THREE.ParticleSystemMaterial({ 
            size: 0.08, color: color, vertexColors: false, transparent: true, depthTest: false, 
            blending: THREE.AdditiveBlending, map: texture });

        particleSystem = new THREE.ParticleSystem(geometry, material);
        particleSystem.rotation.y = -Math.PI / 2;
        particleSystem.sortParticles = true;
        particleSystem.labels = objects.map(function(x){ return x[0]; });
        return particleSystem;
    }

    function load(objects, color, offset){
        var groups = {};
        for (var i=0; i<objects.length; i++){
            var category = objects[i][1];
            if (!groups.hasOwnProperty(category)) groups[category] = [];
            groups[category].push(objects[i]);
        }
        for (var category in groups){
            particleSystems[category] = createParticleSystem(groups[category], color, offset);
            scene.add(particleSystems[category]);
        }
    }

    function init(container, width, height) {
        camera = new THREE.PerspectiveCamera(27, width / height, 0.01, 20.);
        camera.position.z = 10.;

        scene = new THREE.Scene();

        d3.text('data/drug.tsv', function(data){
            var Data = {};
            var objects = d3.tsv.parseRows(data);
            var color = new THREE.Color().setHSL(200./360., 1.0, 0.6);
            load(objects, color, -offset);
            objects.forEach(function(object){ Data[object[0]] = object; });

            d3.text('data/target.tsv', function(data){
                var objects = d3.tsv.parseRows(data);
                var color = new THREE.Color().setHSL(120./360., 1.0, 0.6);
                load(objects, color, +offset);
                objects.forEach(function(object){ Data[object[0]] = object; });

                d3.text('data/relation.tsv', function(data){
                    relations = d3.tsv.parseRows(data);
                    var groups = {};
                    relations.forEach(function(relation){
                        var categories = relation.map(function(x){ return Data[x][1]; });
                        categories.forEach(function(category){
                            if (!groups.hasOwnProperty(category)) groups[category] = [];
                            relation.forEach(function(label){
                                groups[category].push(label);
                            });
                        });
                    });
                    for (var category in groups){
                        relationSystems[category] = createRelationSystem(groups[category]);
                    }
                });
            });
        });

        axisHelper = new THREE.AxisHelper(5.);
        scene.add(axisHelper);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setClearColor(0x000000);
        renderer.setSize(width, height);

        container.appendChild(renderer.domElement);

        gui = new dat.GUI();
        gui.add(config, 'stats').name('Rendering stats').onChange(function(val){
            val ? container.appendChild(stats.domElement) : container.removeChild(stats.domElement);
        });

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('mousedown', onDocumentMouseDown, false);
        document.addEventListener('mouseup', onDocumentMouseUp, false);

        window.addEventListener('resize', onWindowResize, false);
    }

    function onWindowResize(w,h) {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
    }

    function onDocumentMouseDown(event){
        dragging = true;
    }

    function onDocumentMouseUp(event){
        dragging = false;
        dx = dy = 0; // stop rotation
    }

    function onDocumentMouseMove(event){
        var labels = document.body.getElementsByClassName('label');
        for (var i=0; i<labels.length; i++) document.body.removeChild(labels[i]);

        if (dragging){
            dx = (event.clientX - windowHalfX) - mouseX;
            dy = (event.clientY - windowHalfY) - mouseY;
        }
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);

        var projector = new THREE.Projector();

        var hover = null;
        for (var label in particleSystems){
            var particleSystem = particleSystems[label];
            var matrix = new THREE.Matrix4().makeRotationFromEuler(particleSystem.rotation);
            for (var i=0; i<particleSystem.geometry.vertices.length; i++) {
                var vector = particleSystem.geometry.vertices[i].clone();
                vector.applyMatrix4(matrix);
                var r = windowHalfX * 0.08 / (camera.position.z - vector.z);
                projector.projectVector(vector, camera);
                vector.x = vector.x * windowHalfX;
                vector.y = -vector.y * windowHalfY;
                if (((vector.x-mouseX)*(vector.x-mouseX) + (vector.y-mouseY)*(vector.y-mouseY)) < r){
                    text(particleSystem.labels[i], vector);
                    if (particleSystem.labels[i].slice(0,4) != 'EXPT'){
                        scene.add(relationSystems[label]);
                        hover = label;
                    }
                }
            }
            if (label != hover) scene.remove(relationSystems[label]);
        }
    }

    function text(obj, vector){
        var label = document.createElement('div');
        label.className = 'label';
        label.style.position = 'absolute';
        label.style.zIndex = 1; // if you still don't see the label, try uncommenting this
        label.style.padding = '3px';
        label.style.fontSize = '14px';
        label.style.color = 'white';
        label.style.backgroundColor = "rgba(0,0,0,0.7)";
        label.innerHTML = obj;
        label.style.top = mouseY + windowHalfY - 16 + 'px';
        label.style.left = mouseX + windowHalfX + 14 + 'px';
        document.body.appendChild(label);
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
        stats.update();
    }

    function render() {
        for (var label in particleSystems){
            if (particleSystems[label]){
                particleSystems[label].rotation.x += dy * 0.005;
                particleSystems[label].rotation.y += dx * 0.005;
            }
        }
        for (var label in relationSystems){
            if (relationSystems[label]){
                relationSystems[label].rotation.x += dy * 0.005;
                relationSystems[label].rotation.y += dx * 0.005;
            }
        }

        axisHelper.rotation.x += dy * 0.005;
        axisHelper.rotation.y += dx * 0.005;

        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    }
}

var drugbank = new DrugBank();
