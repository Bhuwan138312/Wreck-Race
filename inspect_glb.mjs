import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import fs from 'fs';

const data = fs.readFileSync('public/sedan.glb').buffer;
// Simple Three.js node script without loader because loader requires DOM or more setup.
