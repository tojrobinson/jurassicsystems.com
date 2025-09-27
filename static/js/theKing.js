const preloadImages = [
  'theKingBlur.jpg',
  'macHDBlur.jpg',
  'macHDFocus.jpg',
];

const motionQuery = window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

let prefersReducedMotion = motionQuery ? motionQuery.matches : false;

if (motionQuery) {
  const handleMotionChange = (event) => {
    prefersReducedMotion = event.matches;
  };

  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', handleMotionChange);
  } else if (typeof motionQuery.addListener === 'function') {
    motionQuery.addListener(handleMotionChange);
  }
}

const preloadAssets = (imageNames) => {
  imageNames.forEach((imageName) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = `img/${imageName}`;
  });
};

const attemptVideoPlayback = (video) => {
  if (!video) {
    return;
  }

  const playPromise = video.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      /* Some browsers require a user gesture before playback; ignore errors. */
    });
  }
};

const flickerElement = (element, interval, duration) => {
  if (!element) {
    return;
  }

  if (prefersReducedMotion) {
    element.style.opacity = '1';
    window.setTimeout(() => {
      element.style.opacity = '0';
    }, Math.min(duration, 200));
    return;
  }

  let visible = true;
  const flickering = window.setInterval(() => {
    element.style.opacity = visible ? '1' : '0';
    visible = !visible;
  }, interval);

  window.setTimeout(() => {
    window.clearInterval(flickering);
    element.style.opacity = '0';
  }, duration);
};

const initialiseDragging = (desktopStage) => {
  if (!desktopStage) {
    return;
  }

  let activePointerId = null;
  let draggingWindow = null;
  let offsetX = 0;
  let offsetY = 0;

  const handlePointerMove = (event) => {
    if (event.pointerId !== activePointerId || !draggingWindow) {
      return;
    }

    event.preventDefault();

    const stageRect = desktopStage.getBoundingClientRect();
    const windowRect = draggingWindow.getBoundingClientRect();

    const rawLeft = event.clientX - stageRect.left - offsetX;
    const rawTop = event.clientY - stageRect.top - offsetY;

    const maxLeft = stageRect.width - windowRect.width;
    const maxTop = stageRect.height - windowRect.height;

    const nextLeft = Math.min(Math.max(rawLeft, 0), Math.max(maxLeft, 0));
    const nextTop = Math.min(Math.max(rawTop, 0), Math.max(maxTop, 0));

    draggingWindow.style.left = `${nextLeft}px`;
    draggingWindow.style.top = `${nextTop}px`;
  };

  const handlePointerUp = () => {
    if (!draggingWindow) {
      return;
    }

    draggingWindow.classList.remove('dragging');
    draggingWindow = null;
    activePointerId = null;
  };

  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerup', handlePointerUp);
  document.addEventListener('pointercancel', handlePointerUp);

  desktopStage.querySelectorAll('.window-bar').forEach((bar) => {
    bar.addEventListener('pointerdown', (event) => {
      const targetWindow = bar.closest('.mac-window');
      if (!targetWindow || draggingWindow) {
        return;
      }

      const stageRect = desktopStage.getBoundingClientRect();
      const windowRect = targetWindow.getBoundingClientRect();

      activePointerId = event.pointerId;
      draggingWindow = targetWindow;
      draggingWindow.classList.add('dragging');

      offsetX = event.clientX - windowRect.left;
      offsetY = event.clientY - windowRect.top;

      targetWindow.style.left = `${windowRect.left - stageRect.left}px`;
      targetWindow.style.top = `${windowRect.top - stageRect.top}px`;

      event.preventDefault();
    });
  });
};

const initialiseTheKing = () => {
  preloadAssets(preloadImages);

  const appleDesktop = document.getElementById('apple-desktop');
  const desktopStage = appleDesktop?.querySelector('.desktop-stage') ?? null;
  const macHdWindow = document.getElementById('mac-hd-window');
  const theKingWindow = document.getElementById('the-king-window');
  const theKingVideo = document.getElementById('the-king-video');
  const theKingBlur = document.getElementById('the-king-blur');

  initialiseDragging(desktopStage);

  window.setTimeout(() => {
    attemptVideoPlayback(theKingVideo);

    if (macHdWindow) {
      macHdWindow.style.backgroundImage = 'url(img/macHDBlur.jpg)';
    }

    if (theKingWindow) {
      theKingWindow.hidden = false;
      theKingWindow.removeAttribute('hidden');
      theKingWindow.setAttribute('aria-hidden', 'false');
    }
  }, 2500);

  appleDesktop?.addEventListener('click', (event) => {
    if (!theKingWindow || theKingWindow.contains(event.target)) {
      return;
    }

    if (theKingVideo && theKingVideo.paused) {
      attemptVideoPlayback(theKingVideo);
    }

    flickerElement(theKingBlur, 50, 450);
  });
};

document.addEventListener('DOMContentLoaded', initialiseTheKing);
