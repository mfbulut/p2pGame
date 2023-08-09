const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const keys = {};

canvas.width = window.innerWidth;
addEventListener("resize", () => {
    canvas.width = window.innerWidth;
});

document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    keys["last"] = e.key;
});

document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

const player = {
    position: { x: 120, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    size: { x: 20, y: 50 },
    grounded: false,
    double: true
};

const otherPlayers = new Map();
const objects = [
    { position: { x: 400, y: 500 }, size: { x: 50, y: 50 } },
    { position: { x: 600, y: 400 }, size: { x: 100, y: 50 } },
    { position: { x: 1000, y: 400 }, size: { x: 100, y: 200 } }
];

function updatePlayer() {
    const friction = 0.6;
    const speed = 16;

    const left = keys["a"] ? 1 : 0;
    const right = keys["d"] ? 1 : 0;
    const force = (right - left) * speed * friction ** 3;
    player.acceleration.x += force;
    player.acceleration.x *= friction ** 2;
    player.velocity.x += player.acceleration.x;
    player.velocity.x *= friction;
    player.position.x += player.velocity.x;

    if (player.grounded && keys[" "]) {
        player.velocity.y = -8;
        player.grounded = false;
        player.double = true;
    } else if (player.double && keys["w"]) {
        player.velocity.y = -8;
        player.double = false;
    }

    const gravity = 0.2;
    player.velocity.y += gravity;
    player.position.y += player.velocity.y;
}

function playerCollision() {
    const groundDistance = player.position.y + player.size.y - canvas.height;
    if (groundDistance > 0) {
        player.position.y -= groundDistance;
        player.velocity.y = 0;
        player.acceleration.y = 0;
        player.grounded = true;
        player.double = false;
    }

    objects.forEach((o) => {
        const pxOverlap = player.position.x < o.position.x + o.size.x && player.position.x + player.size.x > o.position.x;
        const pyOverlap = player.position.y < o.position.y + o.size.y && player.position.y + player.size.y > o.position.y;

        if (pxOverlap && pyOverlap) {
            if (player.position.y + player.size.y < o.position.y + 20) {
                const diff = player.position.y + player.size.y - o.position.y;
                player.position.y -= diff;
                player.velocity.y = 0;
                player.acceleration.y = 0;
                player.grounded = true;
                player.double = false;
            } else if (player.position.x < o.position.x) {
                const diff = player.position.x + player.size.x - o.position.x;
                player.position.x -= diff;
            } else if (player.position.x + player.size.x > o.position.x + o.size.x) {
                const diff = player.position.x - o.position.x - o.size.x;
                player.position.x -= diff;
            } else if (player.position.y > o.position.y) {
                const diff = player.position.y - o.position.y - o.size.y;
                player.position.y -= diff;
                player.velocity.y = 0;
                player.acceleration.y = 0;
            }
        }
    });
}

function drawPlayer() {
    ctx.fillStyle = "red";
    ctx.fillRect(player.position.x, player.position.y, player.size.x, player.size.y);
}

function drawOthers() {
    otherPlayers.forEach((p) => {
        ctx.fillStyle = "green";
        ctx.fillRect(p.position.x, p.position.y, p.size.x, p.size.y);
    });
}

function drawObjects() {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    objects.forEach((o) => {
        ctx.roundRect(o.position.x, o.position.y, o.size.x, o.size.y, 4);
    });
    ctx.stroke();
}

function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updatePlayer();
    playerCollision();

    drawObjects();
    drawOthers();
    drawPlayer();
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

const peer = new Peer();
let myID;

peer.on('open', (id) => {
    myID = id;
    const idText = document.getElementById("userID");
    idText.textContent = 'Room ID: ' + id;
    idText.addEventListener("click", () => {
        navigator.clipboard.writeText(id);
    });
});

peer.on('connection', handleConnection);

document.getElementById("join").addEventListener("click", () => {
    const conn = peer.connect(document.getElementById("roomID").value);
    conn.on('open', () => {
        console.log("Connection established");
        handleConnection(conn);
    });
});

function handleConnection(conn) {
    conn.on('data', (data) => {
        otherPlayers.set(data.id, data.player);
    });

    function sendPlayerData() {
        conn.send({ id: myID, player });
        requestAnimationFrame(sendPlayerData);
    }
    requestAnimationFrame(sendPlayerData);
}
