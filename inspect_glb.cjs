const fs = require('fs');
const gltfPipeline = require('gltf-pipeline');
const glbToGltf = gltfPipeline.glbToGltf;

const glbPath = 'd:\\Wreck Race\\kenney_car-kit\\Models\\GLB format\\sedan.glb';
const glb = fs.readFileSync(glbPath);
glbToGltf(glb).then(function(results) {
    const gltf = results.gltf;
    const nodes = gltf.nodes.map(n => n.name);
    console.log("Nodes in sedan.glb:", nodes);
});

const glbPath2 = 'd:\\Wreck Race\\kenney_car-kit\\Models\\GLB format\\suv.glb';
const glb2 = fs.readFileSync(glbPath2);
glbToGltf(glb2).then(function(results) {
    const gltf = results.gltf;
    const nodes = gltf.nodes.map(n => n.name);
    console.log("Nodes in suv.glb:", nodes);
});
