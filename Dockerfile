FROM nginx:1.20.1-alpine


# Add build-dir contents to image
COPY static/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY jurassicsystems.conf /etc/nginx/conf.d/default.conf

EXPOSE 80