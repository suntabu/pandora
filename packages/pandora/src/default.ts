import {DefaultConfigurator} from './universal/DefaultConfigurator';
import {ProcfileReconcilerAccessor} from './application/ProcfileReconcilerAccessor';
import {join} from 'path';
import {homedir} from 'os';

const {DefaultEnvironment} = require('pandora-env');
const {
  ErrorEndPoint,
  HealthEndPoint,
  InfoEndPoint,
  ProcessEndPoint,
  RuntimeEndPoint,
  MetricsEndPoint,
  TraceEndPoint,
  ErrorResource,
  MetricsResource,
  HealthResource,
  TraceResource,
  FileMetricManagerReporter,
  MetricsActuatorServer,
  MetricsClient,
} = require('pandora-metrics');
const {LoggerService} = require('pandora-service-logger');
const hooks = require('pandora-hook');

export default {

  environment: DefaultEnvironment,
  configurator: DefaultConfigurator,

  procfile (pandora: ProcfileReconcilerAccessor) {

    const globalConfig = require('./universal/GlobalConfigProcessor')
      .GlobalConfigProcessor.getInstance().getAllProperties();

    pandora.defaultAppletCategory('worker');
    pandora.defaultServiceCategory('weak-all');

    pandora.environment(globalConfig.environment);
    pandora.configurator(globalConfig.configurator);

    pandora.process('agent')
      .scale(1)
      .env({agent: 'true'});

    pandora.process('worker')
      .scale('auto')
      .env({worker: 'true'});

    pandora.process('background')
      .scale(1)
      .env({background: 'true'});

    pandora.service(LoggerService)
      .name('logger')
      .process('weak-all')
      .config((ctx) => {
        return ctx.config.loggerService;
      });

  },

  logger: {
    logsDir: join(homedir(), 'logs'),
    appLogger: {
      stdoutLevel: 'NONE',
      level: 'INFO'
    },
    daemonLogger: {
      stdoutLevel: 'ERROR',
      level: 'INFO',
    }
  },

  actuatorServer: MetricsActuatorServer,
  metricsClient: MetricsClient,

  actuator: {
    http: {
      enabled: true,
      port: 7002,
    },

    endPoints: {
      error: {
        enabled: true,
        target: ErrorEndPoint,
        resource: ErrorResource,
        initConfig: {
          cacheSize: 100
        }
      },
      health: {
        enabled: true,
        target: HealthEndPoint,
        resource: HealthResource,
        initConfig: {
          port: {
            enabled: true,
            checkUrl: `http://127.1:6001`
          },
          disk_space: {
            enabled: true,
            rate: 80,
          }
        }
      },
      info: {
        enabled: true,
        target: InfoEndPoint,
      },
      process: {
        enabled: true,
        target: ProcessEndPoint,
      },
      runtime: {
        enabled: true,
        target: RuntimeEndPoint
      },
      metrics: {
        enabled: true,
        target: MetricsEndPoint,
        resource: MetricsResource
      },
      trace: {
        enabled: true,
        target: TraceEndPoint,
        resource: TraceResource,
        initConfig: {
          cacheSize: 1000,
          rate: 10
        }
      }
    },
  },

  hooks: {
    eggLogger: {
      enabled: true,
      target: hooks.EggLoggerPatcher,
    },
    urllib: {
      enabled: true,
      target: hooks.UrllibPatcher
    },
  },
  reporter: {
    file: {
      enabled: true,
      target: FileMetricManagerReporter,
      interval: 5
    }
  }
};
