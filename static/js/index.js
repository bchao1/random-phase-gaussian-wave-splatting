window.HELP_IMPROVE_VIDEOJS = false;

// Global easing function for smooth animations
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function sleepSync(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // Busy-waiting: do nothing, just wait for the time to pass
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Get references to all videos and the grid container
  const videos = document.querySelectorAll('.synced-video');
  const videoGrid = document.getElementById('syncedVideoGrid');
  
  // Function to synchronize all videos to the first one
  function syncVideos() {
    const firstVideo = videos[0];
    const currentTime = firstVideo.currentTime;
    
    // Sync all other videos to the first one
    for (let i = 1; i < videos.length; i++) {
      // Only adjust if the time difference is significant
      if (Math.abs(videos[i].currentTime - currentTime) > 0.1) {
        videos[i].currentTime = currentTime;
      }
    }
  }
  
  // Sync videos every second
  setInterval(syncVideos, 1000);
  
  // Pause all videos on mouse enter
  videoGrid.addEventListener('mouseenter', function() {
    videos.forEach(video => {
      video.pause();
    });
  });
  
  // Play all videos on mouse leave
  videoGrid.addEventListener('mouseleave', function() {
    videos.forEach(video => {
      video.play();
    });
  });
  
  // Ensure all videos start at the same time
  videos.forEach(video => {
    video.addEventListener('loadedmetadata', function() {
      // Reset to beginning to ensure sync
      video.currentTime = 0;
      
      // Handle autoplay issues
      video.play().catch(e => {
        console.log('Autoplay prevented. User interaction required.', e);
      });
    });
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const sceneSelector = document.getElementById('scene-selector');
  const phaseButtons = document.querySelectorAll('.phase-buttons .button');
  const focalStackVideo = document.getElementById('focal-stack-video');
  
  // Initial values
  let currentScene = 'bicycle';
  let currentPhase = 'smooth';
  
  // Function to update video source
  function updateFocalStackVideo() {
    
    const videoPath = `./static/videos/sim_fs_videos/${currentScene}_${currentPhase}.mp4`;
    
    // Update video source
    focalStackVideo.querySelector('source').src = videoPath;
    focalStackVideo.load();
    
    // Pause video and update slider when new video loads
    focalStackVideo.addEventListener('loadedmetadata', function onceLoaded() {
      focalStackVideo.pause();
      updateDepthSlider();
      focalStackVideo.removeEventListener('loadedmetadata', onceLoaded);
    });
  }
  
  // Scene selector change event
  sceneSelector.addEventListener('change', function() {
    currentScene = this.value;
    updateFocalStackVideo();
  });
  
  // Phase button click events
  phaseButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove selected class from all buttons
      phaseButtons.forEach(btn => {
        btn.classList.remove('is-active');
      });
      
      // Add selected class to clicked button
      this.classList.add('is-active');
      
      // Update current phase
      currentPhase = this.dataset.phase;
      updateFocalStackVideo();
    });
  });
  
  // Depth slider functionality
  const depthSliderThumb = document.getElementById('depth-slider-thumb');
  const depthSliderTrack = document.querySelector('.depth-slider-track');
  
  let animationId = null;
  let lastUpdateTime = 0;
  
  // Function to update slider position based on video time
  function updateDepthSlider() {
    if (!focalStackVideo.duration) return;
    
    const videoTime = focalStackVideo.currentTime;
    const videoDuration = focalStackVideo.duration;
    
    // Calculate position for far-near-far cycle (two passes)
    // First pass: 0-50% of video (far to near)
    // Second pass: 50-100% of video (near to far)
    let progress;
    if (videoTime <= videoDuration / 2) {
      // First pass: far to near
      progress = videoTime / (videoDuration / 2);
    } else {
      // Second pass: near to far
      progress = 1 - ((videoTime - videoDuration / 2) / (videoDuration / 2));
    }
    
    // Update slider position with smooth animation
    const trackWidth = depthSliderTrack.offsetWidth;
    const thumbWidth = depthSliderThumb.offsetWidth;
    const maxLeft = trackWidth - thumbWidth;
    const targetLeft = progress * maxLeft;
    
    // Use transform for smoother animation
    const currentLeft = parseFloat(depthSliderThumb.style.left) || 0;
    const delta = targetLeft - currentLeft;
    
    // Very smooth interpolation with easing
    const smoothFactor = 0.06;
    const easedDelta = delta * easeOutCubic(smoothFactor);
    const newLeft = currentLeft + easedDelta;
    
    // Ensure the slider reaches the exact edges
    const clampedLeft = Math.max(0, Math.min(maxLeft, newLeft));
    depthSliderThumb.style.left = clampedLeft + 'px';
  }
  
  // Pause video initially and set up slider control
  focalStackVideo.pause();
  
  // Update slider position without animation loop
  function updateDepthSlider() {
    if (!focalStackVideo.duration) return;
    
    const videoTime = focalStackVideo.currentTime;
    const videoDuration = focalStackVideo.duration;
    
    // Calculate position for far-near-far cycle (two passes)
    // First pass: 0-50% of video (far to near)
    // Second pass: 50-100% of video (near to far)
    let progress;
    if (videoTime <= videoDuration / 2) {
      // First pass: far to near
      progress = videoTime / (videoDuration / 2);
    } else {
      // Second pass: near to far
      progress = 1 - ((videoTime - videoDuration / 2) / (videoDuration / 2));
    }
    
    // Update slider position directly (no smooth animation)
    const trackWidth = depthSliderTrack.offsetWidth;
    const thumbWidth = depthSliderThumb.offsetWidth;
    const maxLeft = trackWidth - thumbWidth;
    const targetLeft = progress * maxLeft;
    
    // Set position directly
    depthSliderThumb.style.left = targetLeft + 'px';
  }
  
  // Function to update video time based on slider position
  function updateVideoFromSlider(progress) {
    const videoDuration = focalStackVideo.duration;
    // Map full slider range to first 50% of video
    const videoTime = progress * (videoDuration / 2);
    focalStackVideo.currentTime = videoTime;
  }
  
  // Focal stack slider drag functionality
  let isDragging = false;
  
  depthSliderTrack.addEventListener('mousedown', function(e) {
    isDragging = true;
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    
    const rect = depthSliderTrack.getBoundingClientRect();
    const trackWidth = rect.width;
    let clickX = e.clientX - rect.left;
    let progress = clickX / trackWidth;
    progress = Math.max(0, Math.min(1, progress));
    updateVideoFromSlider(progress);
    
    // Update thumb position directly
    const thumbWidth = depthSliderThumb.offsetWidth;
    const maxLeft = trackWidth - thumbWidth;
    const targetLeft = progress * maxLeft;
    depthSliderThumb.style.left = targetLeft + 'px';
  });
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
  });
});

// Second interactive comparison section for 4D light field
document.addEventListener('DOMContentLoaded', function() {
  const sceneSelector2 = document.getElementById('scene-selector-2');
  const phaseButtons2 = document.querySelectorAll('.phase-buttons-2 .button');
  const lightfieldVideo = document.getElementById('lightfield-video');
  
  // Initial values
  let currentScene2 = 'bicycle';
  let currentPhase2 = 'smooth';
  
  // Function to update light field video source
  function updateLightfieldVideo() {
    
    const videoPath = `./static/videos/sim_lf_videos/${currentScene2}_${currentPhase2}.mp4`;
    
    // Update video source
    lightfieldVideo.querySelector('source').src = videoPath;
    lightfieldVideo.load();
    
    // Pause video and update slider when new video loads
    lightfieldVideo.addEventListener('loadedmetadata', function onceLoaded() {
      lightfieldVideo.pause();
      updateParallaxSlider();
      lightfieldVideo.removeEventListener('loadedmetadata', onceLoaded);
    });
  }
  
  // Scene selector change event
  sceneSelector2.addEventListener('change', function() {
    currentScene2 = this.value;
    updateLightfieldVideo();
  });
  
  // Phase button click events
  phaseButtons2.forEach(button => {
    button.addEventListener('click', function() {
      // Remove selected class from all buttons
      phaseButtons2.forEach(btn => {
        btn.classList.remove('is-active');
      });
      
      // Add selected class to clicked button
      this.classList.add('is-active');
      
      // Update current phase
      currentPhase2 = this.dataset.phase;
      updateLightfieldVideo();
    });
  });
  
  // Parallax slider functionality
  const parallaxSliderThumb = document.getElementById('parallax-slider-thumb');
  const parallaxSliderTrack = parallaxSliderThumb ? parallaxSliderThumb.parentElement : null;
  
  let parallaxAnimationId = null;
  
  // Only proceed if slider elements exist
  if (parallaxSliderThumb && parallaxSliderTrack) {
  
  // Pause video initially and set up slider control
  lightfieldVideo.pause();
  
  // Update slider position without animation loop
  function updateParallaxSlider() {
    if (!lightfieldVideo.duration) return;
    
    const videoTime = lightfieldVideo.currentTime;
    const videoDuration = lightfieldVideo.duration;
    
    // Calculate position for left-right-left cycle (two passes)
    // First pass: 0-50% of video (left to right)
    // Second pass: 50-100% of video (right to left)
    let progress;
    if (videoTime <= videoDuration / 2) {
      // First pass: left to right
      progress = videoTime / (videoDuration / 2);
    } else {
      // Second pass: right to left
      progress = 1 - ((videoTime - videoDuration / 2) / (videoDuration / 2));
    }
    
    // Update slider position directly (no smooth animation)
    const trackWidth = parallaxSliderTrack.offsetWidth;
    const thumbWidth = parallaxSliderThumb.offsetWidth;
    const maxLeft = trackWidth - thumbWidth;
    const targetLeft = progress * maxLeft;
    
    // Set position directly
    parallaxSliderThumb.style.left = targetLeft + 'px';
  }
  
  // Initialize slider position
  lightfieldVideo.addEventListener('loadedmetadata', function() {
    updateParallaxSlider();
  });
  
  // Function to update video time based on slider position
  function updateParallaxVideoFromSlider(progress) {
    const videoDuration = lightfieldVideo.duration;
    // Map full slider range to first 50% of video
    const videoTime = progress * (videoDuration / 2);
    lightfieldVideo.currentTime = videoTime;
  }
  
  // Parallax slider drag functionality
  let isDraggingParallax = false;
  
  parallaxSliderTrack.addEventListener('mousedown', function(e) {
    isDraggingParallax = true;
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', function(e) {
    if (!isDraggingParallax) return;
    
    const rect = parallaxSliderTrack.getBoundingClientRect();
    const trackWidth = rect.width;
    let clickX = e.clientX - rect.left;
    let progress = clickX / trackWidth;
    progress = Math.max(0, Math.min(1, progress));
    updateParallaxVideoFromSlider(progress);
    
    // Update thumb position directly
    const thumbWidth = parallaxSliderThumb.offsetWidth;
    const maxLeft = trackWidth - thumbWidth;
    const targetLeft = progress * maxLeft;
    parallaxSliderThumb.style.left = targetLeft + 'px';
  });
  
  document.addEventListener('mouseup', function() {
    isDraggingParallax = false;
  });
  } // Close the if statement
});

// Third interactive comparison section for extended 4D light field results
document.addEventListener('DOMContentLoaded', function() {
  const sceneSelector3 = document.getElementById('scene-selector-3');
  const extendedLightfieldVideo = document.getElementById('extended-lightfield-video');
  
  // Initial values
  let currentScene3 = 'bicycle';
  
  // Function to update extended light field video source
  function updateExtendedLightfieldVideo() {
    
    const extendedLightfieldVideoPath = `./static/videos/parallax_sim/${currentScene3}.mp4`;
    
    // Store current time to maintain position after source change
    const extendedLightfieldCurrentTime = extendedLightfieldVideo.currentTime;
    
    // Update extended light field video source
    extendedLightfieldVideo.querySelector('source').src = extendedLightfieldVideoPath;
    extendedLightfieldVideo.load();
    
    // Resume playback and restore time position for extended light field video
    extendedLightfieldVideo.addEventListener('loadedmetadata', function onceLoaded() {
      extendedLightfieldVideo.currentTime = extendedLightfieldCurrentTime;
      extendedLightfieldVideo.play();
      extendedLightfieldVideo.removeEventListener('loadedmetadata', onceLoaded);
    });
  }
  
  // Scene selector change event
  sceneSelector3.addEventListener('change', function() {
    currentScene3 = this.value;
    updateExtendedLightfieldVideo();
  });
});

$(document).ready(function() {

    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");

    });

    // teaser
    const video = document.getElementById("teaser-video");

    // Pause videos on hover
    video.addEventListener("mouseenter", () => {
      video.pause();
    });

    // Resume videos on leave
    video.addEventListener("mouseleave", () => {
      video.play();
    });

    var options = {
			slidesToScroll: 1,
			slidesToShow: 1,
			loop: true,
			infinite: true,
			autoplay: false,
			autoplaySpeed: 3000,
    }

    // carousel for the video
    let carousel_div = document.getElementById("results-carousel");
    var video_id_list = [
      "room",
      "stump",
      "garden",
      "kitchen",
      "hotdog",
      "lego",
      "ship",
      "materials",
      "chair"
    ];
    for (var i = 0; i < video_id_list.length; i++) {
        let video_element = document.getElementById(video_id_list[i]);
        console.log(video_element);
        video_element.addEventListener('mouseenter', () => {
          video_element.pause();
        });

        // Play the video when the mouse leaves
        video_element.addEventListener('mouseleave', () => {
          video_element.play();
        });
    }

		// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);
    // Loop on each carousel initialized
    for(var i = 0; i < carousels.length; i++) {
    	carousels[i].on('before:show', state => {
        console.log('before:show', state);
    	});
    }



    // Access to bulmaCarousel instance of an element
    var element = document.querySelector("#carousel-div");
    if (element && element.bulmaCarousel) {
    	// bulmaCarousel instance is available as element.bulmaCarousel
    	element.bulmaCarousel.on('before:show', function(state) {
    		console.log("before show", state);
    	});
    }
    bulmaSlider.attach();
})

// Select teaser scene
let teaserScene = "garden";
function selectTeaserScene(scene) {
  console.log("selecting scene: " + scene);
  document.querySelectorAll('[id^="teaser-button"]').forEach(button => button.classList.remove('is-active-teaser'));
  document.getElementById(`teaser-button-${scene}`).classList.add('is-active-teaser');
  teaserScene = scene;
  updateTeaserVideo();
}

function updateTeaserVideo() {
  document.getElementById('teaser-video').src = `static/videos/${teaserScene}_nvs_focal_stack.mp4`;
}

