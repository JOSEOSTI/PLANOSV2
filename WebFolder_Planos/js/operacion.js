let activeZoomHandler = null;

function setupZoomAndDrag(wrapperSelector, zoomInSelector, zoomOutSelector, imgSelector) {
    let scale = 1;
    let translateX = 0;
    let translateY = 0;

    const $wrapper = $(wrapperSelector);
    const $img = $(imgSelector);

    function updateTransform() {
        $wrapper.css({
            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
            transformOrigin: 'center center'
        });
    }

    function fitToContainer() {
        const img = $img[0];
        if (!img || !img.naturalWidth || !img.naturalHeight) return;

        updateTransform();
    }

    const img = $img[0];
    if (img.complete && img.naturalWidth) {
        fitToContainer();
    } else {
        img.onload = fitToContainer;
    }

    $(zoomInSelector).on('click', () => zoomIn());
    $(zoomOutSelector).on('click', () => zoomOut());

    let isDragging = false;
    let lastX, lastY;

    $wrapper.on('mousedown', function (e) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        $wrapper.css('cursor', 'grabbing');
        e.preventDefault();
    });

    $(document).on('mousemove', function (e) {
        if (!isDragging) return;

        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;

        translateX += dx;
        translateY += dy;

        lastX = e.clientX;
        lastY = e.clientY;

        updateTransform();
    });

    $(document).on('mouseup', function () {
        isDragging = false;
        $wrapper.css('cursor', 'grab');
    });

    $wrapper.on('mouseenter', function () {
        $wrapper.css('cursor', 'grab');
    });

    $wrapper.on('mouseleave', function () {
        if (!isDragging) {
            $wrapper.css('cursor', 'default');
        }
    });

    $(window).on('resize', fitToContainer);

    function zoomIn() {
        const newScale = Math.min(3, scale + 0.1);
        const delta = newScale - scale;
        translateX -= (delta * $img[0].naturalWidth) / 2;
        translateY -= (delta * $img[0].naturalHeight) / 2;
        scale = newScale;
        updateTransform();
    }

    function zoomOut() {
        const newScale = Math.max(0.1, scale - 0.1);
        const delta = newScale - scale;
        translateX -= (delta * $img[0].naturalWidth) / 2;
        translateY -= (delta * $img[0].naturalHeight) / 2;
        scale = newScale;
        updateTransform();
    }

    return {
        zoomIn,
        zoomOut
    };
}

// Al cargar
// $(function () {
//     // Solo uno se activa, por ejemplo el principal
//     activeZoomHandler = setupZoomAndDrag('#fp-wrapper', '#zoom-in', '#zoom-out', '#fp-img');
//     activeZoomHandler = setupZoomAndDrag('#fp-wrapper2', '#zoom-in2', '#zoom-out2', '#fp-img2');
    
// });

function zoom_mas() {
    console.log("+");
    
    if (activeZoomHandler) {
        activeZoomHandler.zoomIn();
    } else {
        console.warn("No hay contenedor activo");
    }
}

function zoom_menos() {
        console.log("-");

    if (activeZoomHandler) {
        activeZoomHandler.zoomOut();
    } else {
        console.warn("No hay contenedor activo");
    }
}