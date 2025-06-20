FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY lib /usr/share/nginx/html/lib
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
