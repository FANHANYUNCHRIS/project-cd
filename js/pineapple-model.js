/* RoundedBoxGeometry adapted from Three.js r170.

The MIT License

Copyright © 2010-2024 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function (THREE) {
    'use strict';
    if (!THREE) return;
    const { BoxGeometry, Vector3 } = THREE;
    const _tempNormal = new Vector3();

    function getUv( faceDirVector, normal, uvAxis, projectionAxis, radius, sideLength ) {

        const totArcLength = 2 * Math.PI * radius / 4;

        // length of the planes between the arcs on each axis
        const centerLength = Math.max( sideLength - 2 * radius, 0 );
        const halfArc = Math.PI / 4;

        // Get the vector projected onto the Y plane
        _tempNormal.copy( normal );
        _tempNormal[ projectionAxis ] = 0;
        _tempNormal.normalize();

        // total amount of UV space alloted to a single arc
        const arcUvRatio = 0.5 * totArcLength / ( totArcLength + centerLength );

        // the distance along one arc the point is at
        const arcAngleRatio = 1.0 - ( _tempNormal.angleTo( faceDirVector ) / halfArc );

        if ( Math.sign( _tempNormal[ uvAxis ] ) === 1 ) {

            return arcAngleRatio * arcUvRatio;

        } else {

            // total amount of UV space alloted to the plane between the arcs
            const lenUv = centerLength / ( totArcLength + centerLength );
            return lenUv + arcUvRatio + arcUvRatio * ( 1.0 - arcAngleRatio );

        }

    }

    class RoundedBoxGeometry extends BoxGeometry {

        constructor( width = 1, height = 1, depth = 1, segments = 2, radius = 0.1 ) {

            // ensure segments is odd so we have a plane connecting the rounded corners
            segments = segments * 2 + 1;

            // ensure radius isn't bigger than shortest side
            radius = Math.min( width / 2, height / 2, depth / 2, radius );

            super( 1, 1, 1, segments, segments, segments );

            // if we just have one segment we're the same as a regular box
            if ( segments === 1 ) return;

            const geometry2 = this.toNonIndexed();

            this.index = null;
            this.attributes.position = geometry2.attributes.position;
            this.attributes.normal = geometry2.attributes.normal;
            this.attributes.uv = geometry2.attributes.uv;

            //

            const position = new Vector3();
            const normal = new Vector3();

            const box = new Vector3( width, height, depth ).divideScalar( 2 ).subScalar( radius );

            const positions = this.attributes.position.array;
            const normals = this.attributes.normal.array;
            const uvs = this.attributes.uv.array;

            const faceTris = positions.length / 6;
            const faceDirVector = new Vector3();
            const halfSegmentSize = 0.5 / segments;

            for ( let i = 0, j = 0; i < positions.length; i += 3, j += 2 ) {

                position.fromArray( positions, i );
                normal.copy( position );
                normal.x -= Math.sign( normal.x ) * halfSegmentSize;
                normal.y -= Math.sign( normal.y ) * halfSegmentSize;
                normal.z -= Math.sign( normal.z ) * halfSegmentSize;
                normal.normalize();

                positions[ i + 0 ] = box.x * Math.sign( position.x ) + normal.x * radius;
                positions[ i + 1 ] = box.y * Math.sign( position.y ) + normal.y * radius;
                positions[ i + 2 ] = box.z * Math.sign( position.z ) + normal.z * radius;

                normals[ i + 0 ] = normal.x;
                normals[ i + 1 ] = normal.y;
                normals[ i + 2 ] = normal.z;

                const side = Math.floor( i / faceTris );

                switch ( side ) {

                    case 0: // right

                        // generate UVs along Z then Y
                        faceDirVector.set( 1, 0, 0 );
                        uvs[ j + 0 ] = getUv( faceDirVector, normal, 'z', 'y', radius, depth );
                        uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'y', 'z', radius, height );
                        break;

                    case 1: // left

                        // generate UVs along Z then Y
                        faceDirVector.set( - 1, 0, 0 );
                        uvs[ j + 0 ] = 1.0 - getUv( faceDirVector, normal, 'z', 'y', radius, depth );
                        uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'y', 'z', radius, height );
                        break;

                    case 2: // top

                        // generate UVs along X then Z
                        faceDirVector.set( 0, 1, 0 );
                        uvs[ j + 0 ] = 1.0 - getUv( faceDirVector, normal, 'x', 'z', radius, width );
                        uvs[ j + 1 ] = getUv( faceDirVector, normal, 'z', 'x', radius, depth );
                        break;

                    case 3: // bottom

                        // generate UVs along X then Z
                        faceDirVector.set( 0, - 1, 0 );
                        uvs[ j + 0 ] = 1.0 - getUv( faceDirVector, normal, 'x', 'z', radius, width );
                        uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'z', 'x', radius, depth );
                        break;

                    case 4: // front

                        // generate UVs along X then Y
                        faceDirVector.set( 0, 0, 1 );
                        uvs[ j + 0 ] = 1.0 - getUv( faceDirVector, normal, 'x', 'y', radius, width );
                        uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'y', 'x', radius, height );
                        break;

                    case 5: // back

                        // generate UVs along X then Y
                        faceDirVector.set( 0, 0, - 1 );
                        uvs[ j + 0 ] = getUv( faceDirVector, normal, 'x', 'y', radius, width );
                        uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'y', 'x', radius, height );
                        break;

                }

            }

        }

    }

    window.initPineappleModel = async function (stage) {
        const canvas = stage.querySelector('canvas');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.02;

        const key = new THREE.DirectionalLight(0xffe6bf, 2.7);
        key.position.set(-3, 6, 5);
        const fill = new THREE.DirectionalLight(0xfff6e5, 0.8);
        fill.position.set(4, 1, -2);
        scene.add(new THREE.HemisphereLight(0xfff4dc, 0x7b654b, 1.05), key, fill);

        let texture;
        try {
            texture = await new THREE.TextureLoader().loadAsync('images/pineapple-model-texture.jpg');
        } catch (error) {
            renderer.dispose();
            throw error;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

        const geometry = new RoundedBoxGeometry(3.05, 1.04, 2.02, 22, 0.14);
        const positions = geometry.attributes.position;
        const butter = new THREE.Color('#fff6dc');
        const toast = new THREE.Color('#bc7b38');
        const tint = new THREE.Color();
        const colors = [];
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            const bump = Math.sin(x * 31.7 + z * 12.3) * Math.sin(z * 27.2 + y * 19.4) * 0.006
                + Math.sin(x * 7.2 + z * 8.4) * 0.008;
            positions.setXYZ(i, x + bump, y + bump * 0.6, z + bump);
            const rim = Math.pow(Math.min(1, Math.max(Math.abs(x) / 1.525, Math.abs(z) / 1.01)), 12);
            const top = Math.pow(Math.min(1, Math.abs(y) / 0.52), 6);
            const browning = rim * (0.18 + 0.12 * top)
                + 0.035 * (0.5 + 0.5 * Math.sin(x * 8.2 + z * 11.6)) + (y < -0.4 ? 0.07 : 0);
            tint.copy(butter).lerp(toast, browning);
            colors.push(tint.r, tint.g, tint.b);
        }
        geometry.computeVertexNormals();
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const material = new THREE.MeshStandardMaterial({
            map: texture, bumpMap: texture, bumpScale: 0.055, roughness: 0.82, vertexColors: true
        });
        material.onBeforeCompile = shader => {
            shader.vertexShader = shader.vertexShader
                .replace('#include <common>', '#include <common>\nvarying vec3 pastryPosition;')
                .replace('#include <begin_vertex>', '#include <begin_vertex>\npastryPosition = position;');
            shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
                varying vec3 pastryPosition;
                float grain(vec3 p) {
                    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
                }
            `).replace('#include <color_fragment>', `#include <color_fragment>
                float pore = grain(floor(pastryPosition * 420.0));
                float micro = grain(floor(pastryPosition * 160.0));
                diffuseColor.rgb *= (0.96 + 0.065 * pore) * (1.0 - 0.13 * step(0.975, micro));
            `);
        };

        const cake = new THREE.Group();
        cake.add(new THREE.Mesh(geometry, material));
        const crumbGeometry = new THREE.IcosahedronGeometry(1, 0);
        const crumbMaterial = new THREE.MeshStandardMaterial({ color: 0xd6a65b, roughness: 1 });
        let seed = 123;
        function random() {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        }
        for (let i = 0; i < 110; i++) {
            const crumb = new THREE.Mesh(crumbGeometry, crumbMaterial);
            const edge = random() < 0.5;
            crumb.position.set((random() - 0.5) * 2.88, 0.49 + random() * 0.025, (random() - 0.5) * 1.86);
            if (edge) {
                crumb.position.z = random() < 0.5 ? -0.97 : 0.97;
                crumb.position.y = (random() - 0.5) * 0.9;
            }
            const size = 0.004 + random() * 0.013;
            crumb.scale.set(size * 1.4, size * 0.65, size);
            crumb.rotation.set(random() * 6, random() * 6, random() * 6);
            cake.add(crumb);
        }
        const modelBounds = new THREE.Box3().setFromObject(cake);
        const size = modelBounds.getSize(new Vector3());
        // 1 mm = 0.05 scene units. The vertical axis is Y.
        cake.scale.set(67 * 0.05 / size.x, 22 * 0.05 / size.y, 35 * 0.05 / size.z);
        const radius = new Vector3(
            Math.max(-modelBounds.min.x, modelBounds.max.x),
            Math.max(-modelBounds.min.y, modelBounds.max.y),
            Math.max(-modelBounds.min.z, modelBounds.max.z)
        ).multiply(cake.scale).length();
        const isShowcase = stage.classList.contains('pastry-stage');
        const initialRotation = new THREE.Euler(0.14, isShowcase ? -Math.PI / 4 : -0.55, -0.045);
        cake.rotation.copy(initialRotation);
        cake.updateMatrix();
        const initialModelMatrix = cake.matrix.clone();
        scene.add(cake);

        function render() {
            renderer.render(scene, camera);
        }

        function resize() {
            const { width, height } = stage.getBoundingClientRect();
            if (!width || !height) return;
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            // Fit the whole rotation sphere, leaving room for the framing offset.
            const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
            const safeAngle = Math.atan(Math.tan(halfFov) * Math.min(1, camera.aspect) * 0.85);
            const distance = Math.max(isShowcase ? 5.5 : 6.8, radius / Math.sin(safeAngle));
            camera.position.set(0, 0.31, 1).setLength(distance);
            camera.lookAt(0, 0, 0);
            camera.clearViewOffset();

            if (isShowcase) {
                // Center the projected silhouette at the default viewing angle.
                camera.updateMatrixWorld();
                const projection = new THREE.Matrix4()
                    .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
                    .multiply(initialModelMatrix);
                const bounds = new THREE.Box2();
                const vertex = new Vector3();
                for (let i = 0; i < positions.count; i++) {
                    vertex.fromBufferAttribute(positions, i).applyMatrix4(projection);
                    bounds.expandByPoint(vertex);
                }
                const center = bounds.getCenter(new THREE.Vector2());
                center.clampScalar(-0.12, 0.12);
                camera.setViewOffset(width, height, center.x * width / 2, -center.y * height / 2, width, height);
            }
            render();
        }
        resize();
        new ResizeObserver(resize).observe(stage);

        let interactive = true;
        let pointerId;
        let lastX;
        let lastY;
        canvas.addEventListener('pointerdown', event => {
            if (!interactive || pointerId !== undefined || event.button !== 0) return;
            pointerId = event.pointerId;
            lastX = event.clientX;
            lastY = event.clientY;
            canvas.setPointerCapture(pointerId);
        });
        canvas.addEventListener('pointermove', event => {
            if (event.pointerId !== pointerId) return;
            cake.rotation.y += (event.clientX - lastX) * 0.009;
            cake.rotation.x += (event.clientY - lastY) * 0.009;
            lastX = event.clientX;
            lastY = event.clientY;
            render();
        });
        canvas.addEventListener('lostpointercapture', event => {
            if (event.pointerId === pointerId) pointerId = undefined;
        });
        const arrows = { ArrowLeft: [0, -0.1], ArrowRight: [0, 0.1], ArrowUp: [-0.1, 0], ArrowDown: [0.1, 0] };
        canvas.addEventListener('keydown', event => {
            const direction = arrows[event.key];
            if (!interactive || !direction) return;
            event.preventDefault();
            cake.rotation.x += direction[0];
            cake.rotation.y += direction[1];
            render();
        });

        return function setInteractive(enabled) {
            interactive = enabled;
            canvas.tabIndex = enabled ? 0 : -1;
            canvas.classList.toggle('is-static', !enabled);
            canvas.setAttribute('aria-label', enabled
                ? '鳳梨酥 3D 模型，可拖曳或使用方向鍵旋轉'
                : '鳳梨酥 2D 固定視角');
            if (enabled) return;

            if (pointerId !== undefined && canvas.hasPointerCapture(pointerId)) {
                canvas.releasePointerCapture(pointerId);
            }
            pointerId = undefined;
            cake.rotation.copy(initialRotation);
            render();
        };
    };
})(window.THREE);
