ARG NODE_IMAGE=node:24-alpine
FROM ${NODE_IMAGE}
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
WORKDIR /opt/moex
COPY --chown=node:node app/ ./app/
COPY --chown=node:node src/ ./src/
COPY --chown=node:node package.json VERSION ./
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"
CMD ["node","app/server.mjs"]
