<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

```
ms-users
├─ .docker-compose.yml
├─ .dockerignore
├─ .prettierrc
├─ docker-compose.yml
├─ Dockerfile
├─ eslint.config.mjs
├─ LICENSE
├─ nest-cli.json
├─ package.json
├─ pnpm-lock.yaml
├─ prisma
│  ├─ migrations
│  │  ├─ 20251025135745_init
│  │  │  └─ migration.sql
│  │  ├─ 20251027024931
│  │  │  └─ migration.sql
│  │  ├─ 20251201211847_add_enterprise_join_requests
│  │  │  └─ migration.sql
│  │  ├─ 20251201213532_add_owner_to_user_enterprise
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
│  └─ schema.prisma
├─ prisma.config.ts
├─ README.md
├─ src
│  ├─ app.controller.spec.ts
│  ├─ app.controller.ts
│  ├─ app.module.ts
│  ├─ app.service.ts
│  ├─ audit-log
│  │  ├─ audit-log.controller.spec.ts
│  │  ├─ audit-log.controller.ts
│  │  ├─ audit-log.module.ts
│  │  ├─ audit-log.service.spec.ts
│  │  ├─ audit-log.service.ts
│  │  └─ dto
│  │     ├─ create-audit-log.dto.ts
│  │     ├─ index.ts
│  │     └─ query-audit-log.dto.ts
│  ├─ auth
│  │  ├─ auth.controller.spec.ts
│  │  ├─ auth.controller.ts
│  │  ├─ auth.guard.ts
│  │  ├─ auth.module.ts
│  │  ├─ auth.service.spec.ts
│  │  ├─ auth.service.ts
│  │  ├─ constants.ts
│  │  ├─ decorators
│  │  │  ├─ current-user.decorator.ts
│  │  │  ├─ index.ts
│  │  │  ├─ public.decorator.ts
│  │  │  └─ roles.decorator.ts
│  │  ├─ dto
│  │  │  ├─ login.dto.ts
│  │  │  ├─ refresh-token.dto.ts
│  │  │  └─ register.dto.ts
│  │  ├─ guards
│  │  │  ├─ access-token.guard.ts
│  │  │  ├─ enterprise-permission.guard.ts
│  │  │  ├─ index.ts
│  │  │  ├─ owner.guard.ts
│  │  │  ├─ refresh-token.guard.ts
│  │  │  └─ roles.guard.ts
│  │  └─ strategies
│  │     ├─ access-token.strategy.ts
│  │     └─ refresh-token.strategy.ts
│  ├─ config
│  │  ├─ app-config.service.ts
│  │  ├─ config.interface.ts
│  │  ├─ config.module.ts
│  │  ├─ configuration.ts
│  │  ├─ env.validation.ts
│  │  └─ index.ts
│  ├─ create-audit-log.dto.ts
│  │  └─ create-audit-log.dto.ts.module.ts
│  ├─ enterprise
│  │  ├─ dto
│  │  │  ├─ create-enterprise.dto.ts
│  │  │  ├─ handle-join-request.dto.ts
│  │  │  ├─ index.ts
│  │  │  ├─ join-enterprise.dto.ts
│  │  │  └─ update-enterprise.dto.ts
│  │  ├─ enterprise.controller.spec.ts
│  │  ├─ enterprise.controller.ts
│  │  ├─ enterprise.module.ts
│  │  ├─ enterprise.service.spec.ts
│  │  └─ enterprise.service.ts
│  ├─ enterprise-permission
│  │  ├─ dto
│  │  │  ├─ assign-enterprise-permission.dto.ts
│  │  │  ├─ bulk-assign-permissions.dto.ts
│  │  │  ├─ index.ts
│  │  │  └─ revoke-enterprise-permission.dto.ts
│  │  ├─ enterprise-permission.controller.spec.ts
│  │  ├─ enterprise-permission.controller.ts
│  │  ├─ enterprise-permission.module.ts
│  │  ├─ enterprise-permission.service.spec.ts
│  │  └─ enterprise-permission.service.ts
│  ├─ main.ts
│  ├─ permission-assignment
│  │  ├─ dto
│  │  │  ├─ assign-permission.dto.ts
│  │  │  ├─ bulk-assign-user-permissions.dto.ts
│  │  │  ├─ index.ts
│  │  │  └─ update-permission-assignment.dto.ts
│  │  ├─ permission-assignment.controller.spec.ts
│  │  ├─ permission-assignment.controller.ts
│  │  ├─ permission-assignment.module.ts
│  │  ├─ permission-assignment.service.spec.ts
│  │  └─ permission-assignment.service.ts
│  ├─ prisma
│  │  ├─ prisma.module.ts
│  │  ├─ prisma.service.spec.ts
│  │  └─ prisma.service.ts
│  ├─ profile
│  │  ├─ dto
│  │  │  ├─ certification
│  │  │  │  ├─ create-certification.dto.ts
│  │  │  │  └─ update-certification.dto.ts
│  │  │  ├─ education
│  │  │  │  ├─ create-education.dto.ts
│  │  │  │  └─ update-education.dto.ts
│  │  │  ├─ experience
│  │  │  │  ├─ create-experience.dto.ts
│  │  │  │  └─ update-experience.dto.ts
│  │  │  ├─ index.ts
│  │  │  ├─ language
│  │  │  │  ├─ create-language.dto.ts
│  │  │  │  └─ update-language.dto.ts
│  │  │  ├─ skill
│  │  │  │  ├─ create-skill.dto.ts
│  │  │  │  └─ update-skill.dto.ts
│  │  │  └─ update-profile.dto.ts
│  │  ├─ profile.controller.spec.ts
│  │  ├─ profile.controller.ts
│  │  ├─ profile.module.ts
│  │  ├─ profile.service.spec.ts
│  │  └─ profile.service.ts
│  ├─ roles
│  │  ├─ dto
│  │  │  ├─ assign-role.dto.ts
│  │  │  ├─ create-role.dto.ts
│  │  │  ├─ index.ts
│  │  │  └─ update-role.dto.ts
│  │  ├─ roles.controller.spec.ts
│  │  ├─ roles.controller.ts
│  │  ├─ roles.module.ts
│  │  ├─ roles.service.spec.ts
│  │  └─ roles.service.ts
│  ├─ user-relationship
│  │  ├─ dto
│  │  │  ├─ create-relationship.dto.ts
│  │  │  ├─ handle-relationship.dto.ts
│  │  │  ├─ index.ts
│  │  │  └─ update-relationship.dto.ts
│  │  ├─ user-relationship.controller.ts
│  │  ├─ user-relationship.module.ts
│  │  ├─ user-relationship.service.spec.ts
│  │  └─ user-relationship.service.ts
│  └─ users
│     ├─ dto
│     │  ├─ createUser.dto.ts
│     │  ├─ getUser.dto.ts
│     │  ├─ register.dto.ts
│     │  └─ updateUser.dto.ts
│     ├─ users.controller.spec.ts
│     ├─ users.controller.ts
│     ├─ users.module.ts
│     ├─ users.service.spec.ts
│     └─ users.service.ts
├─ test
│  ├─ app.e2e-spec.ts
│  └─ jest-e2e.json
├─ tsconfig.build.json
└─ tsconfig.json

```

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

To run you must run the next bash block: 
```bash
$ cp .env.example .env
$ nano .env #Aca lo importante es ponerle sus variables de entorno.
$ docker-compose up -d 
```

Asi todo estara en http://localhost:3000


Para dejar de usar el puerto: 

```bash
$ docker-compose down
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

