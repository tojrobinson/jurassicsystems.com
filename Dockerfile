FROM nginx:1.29.1-alpine

EXPOSE 8080

WORKDIR /usr/share/nginx/html
COPY ./static /usr/share/nginx/html

COPY nginx-docker.conf /etc/nginx/conf.d/default.conf

