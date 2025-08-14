// Facebook-Style Individual Page Loader
// Shows loading state for each page while content loads
(function(){
    'use strict';
    
    // Create Facebook-style loader overlay
    function createPageLoader() {
        const loader = document.createElement('div');
        loader.id = 'pageLoader';
        loader.className = 'page-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-spinner">
                    <div class="spinner-ring"></div>
                </div>
                <div class="loader-text">Loading...</div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .page-loader {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 1;
                transition: opacity 0.3s ease;
            }
            
            .page-loader.hidden {
                opacity: 0;
                pointer-events: none;
            }
            
            .loader-content {
                text-align: center;
            }
            
            .loader-spinner {
                margin-bottom: 16px;
            }
            
            .spinner-ring {
                width: 40px;
                height: 40px;
                border: 3px solid #e4e6eb;
                border-top: 3px solid #1877f2;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            }
            
            .loader-text {
                color: #65676b;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .page-loader {
                    background: rgba(28, 30, 33, 0.95);
                }
                .loader-text {
                    color: #e4e6eb;
                }
                .spinner-ring {
                    border-color: #3a3b3c;
                    border-top-color: #1877f2;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(loader);
        return loader;
    }
    
    // Hide loader when page is ready
    function hideLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 300);
        }
    }
    
    // Show loader
    function showLoader() {
        const loader = document.getElementById('pageLoader') || createPageLoader();
        loader.classList.remove('hidden');
    }
    
    // Track page load completion
    function trackPageLoad() {
        let imagesLoaded = 0;
        let totalImages = 0;
        let networkRequests = 0;
        let completedRequests = 0;
        
        // Track images
        function trackImages() {
            const images = document.querySelectorAll('img');
            totalImages = images.length;
            
            images.forEach(img => {
                if (img.complete) {
                    imagesLoaded++;
                } else {
                    img.addEventListener('load', () => {
                        imagesLoaded++;
                        checkReady();
                    });
                    img.addEventListener('error', () => {
                        imagesLoaded++;
                        checkReady();
                    });
                }
            });
            
            // Track dynamically added images
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (node.tagName === 'IMG') {
                                totalImages++;
                                if (node.complete) {
                                    imagesLoaded++;
                                } else {
                                    node.addEventListener('load', () => {
                                        imagesLoaded++;
                                        checkReady();
                                    });
                                    node.addEventListener('error', () => {
                                        imagesLoaded++;
                                        checkReady();
                                    });
                                }
                            }
                            const innerImages = node.querySelectorAll ? node.querySelectorAll('img') : [];
                            innerImages.forEach(img => {
                                totalImages++;
                                if (img.complete) {
                                    imagesLoaded++;
                                } else {
                                    img.addEventListener('load', () => {
                                        imagesLoaded++;
                                        checkReady();
                                    });
                                    img.addEventListener('error', () => {
                                        imagesLoaded++;
                                        checkReady();
                                    });
                                }
                            });
                        }
                    });
                });
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
        }
        
        // Track network requests
        function trackNetworkRequests() {
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                networkRequests++;
                return originalFetch.apply(this, args)
                    .then(response => {
                        completedRequests++;
                        checkReady();
                        return response;
                    })
                    .catch(error => {
                        completedRequests++;
                        checkReady();
                        throw error;
                    });
            };
            
            const originalXHROpen = XMLHttpRequest.prototype.open;
            const originalXHRSend = XMLHttpRequest.prototype.send;
            
            XMLHttpRequest.prototype.open = function(...args) {
                this._loaderTracked = true;
                return originalXHROpen.apply(this, args);
            };
            
            XMLHttpRequest.prototype.send = function(...args) {
                if (this._loaderTracked) {
                    networkRequests++;
                    this.addEventListener('loadend', () => {
                        completedRequests++;
                        checkReady();
                    }, { once: true });
                }
                return originalXHRSend.apply(this, args);
            };
        }
        
        // Check if page is ready
        function checkReady() {
            const imagesReady = totalImages === 0 || imagesLoaded >= totalImages;
            const networkReady = networkRequests === 0 || completedRequests >= networkRequests;
            const domReady = document.readyState === 'complete';
            
            if (imagesReady && networkReady && domReady) {
                setTimeout(hideLoader, 500); // Small delay for smooth transition
            }
        }
        
        // Initialize tracking
        trackImages();
        trackNetworkRequests();
        
        // Fallback: Hide loader after reasonable time
        setTimeout(() => {
            hideLoader();
        }, 8000);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            showLoader();
            trackPageLoad();
        });
    } else {
        showLoader();
        trackPageLoad();
    }
    
    // Export for manual control
    window.pageLoader = {
        show: showLoader,
        hide: hideLoader
    };
})();