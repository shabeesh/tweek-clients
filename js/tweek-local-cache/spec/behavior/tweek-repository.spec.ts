import { expect } from 'chai';
import getenv = require('getenv');
import { createTweekClient, ITweekClient, Context } from 'tweek-client';
import MemoryStore from '../../src/memory-store';
import TweekRepository from '../../src/tweek-repository';

const TWEEK_LOCAL_API = getenv.string('TWEEK_LOCAL_API', 'http://127.0.0.1:1111');

describe('tweek repo behavior test', () => {
  let _tweekRepo: TweekRepository;
  let _tweekClient: ITweekClient;

  async function initTweekRepository(context: Context = {}) {
    _tweekClient = createTweekClient({ baseServiceUrl: TWEEK_LOCAL_API });

    const store = new MemoryStore();
    _tweekRepo = new TweekRepository({ client: _tweekClient });
    _tweekRepo.context = context;
    await _tweekRepo.useStore(store);
  }

  const testDefenitions: {
    pathsToPrepare: string[];
    expectedKeys: { keyName: string; value: any }[];
    context: Context;
  }[] = [];

  testDefenitions.push({
    context: {},
    pathsToPrepare: ['@tweek_clients_tests/test_category/test_key1'],
    expectedKeys: [{ keyName: '@tweek_clients_tests/test_category/test_key1', value: 'def value' }],
  });

  testDefenitions.push({
    context: {},
    pathsToPrepare: [
      '@tweek_clients_tests/test_category/test_key1',
      '@tweek_clients_tests/test_category/test_key2',
      '@tweek_clients_tests/test_category2/user_fruit',
    ],
    expectedKeys: [
      { keyName: '@tweek_clients_tests/test_category/test_key1', value: 'def value' },
      { keyName: '@tweek_clients_tests/test_category/test_key2', value: false },
      { keyName: '@tweek_clients_tests/test_category2/user_fruit', value: 'apple' },
    ],
  });

  testDefenitions.push({
    context: {
      device: {
        DeviceOsType: 'Ios',
        PartnerBrandId: 'testPartner',
        DeviceType: 'Desktop',
      },
    },
    pathsToPrepare: [
      '@tweek_clients_tests/test_category/test_key1',
      '@tweek_clients_tests/test_category/test_key2',
      '@tweek_clients_tests/test_category2/user_fruit',
    ],
    expectedKeys: [
      { keyName: '@tweek_clients_tests/test_category/test_key1', value: 'ios value' },
      { keyName: '@tweek_clients_tests/test_category/test_key2', value: true },
      { keyName: '@tweek_clients_tests/test_category2/user_fruit', value: 'orange' },
    ],
  });

  testDefenitions.push({
    context: {
      device: {
        DeviceOsType: 'Ios',
        PartnerBrandId: 'testPartner',
        DeviceType: 'Desktop',
      },
    },
    pathsToPrepare: ['@tweek_clients_tests/test_category/_', '@tweek_clients_tests/test_category2/_'],
    expectedKeys: [
      { keyName: '@tweek_clients_tests/test_category/test_key1', value: 'ios value' },
      { keyName: '@tweek_clients_tests/test_category/test_key2', value: true },
      { keyName: '@tweek_clients_tests/test_category2/user_fruit', value: 'orange' },
    ],
  });

  testDefenitions.push({
    context: {
      device: {
        DeviceType: 'Desktop',
      },
    },
    pathsToPrepare: ['@tweek_clients_tests/_'],
    expectedKeys: [
      { keyName: '@tweek_clients_tests/test_category/test_key1', value: 'def value' },
      { keyName: '@tweek_clients_tests/test_category/test_key2', value: false },
      { keyName: '@tweek_clients_tests/test_category2/user_fruit', value: 'orange' },
    ],
  });

  testDefenitions.forEach(test =>
    it('should succeed get keys values', async () => {
      // Arrange
      await initTweekRepository(test.context);

      test.pathsToPrepare.forEach(x => _tweekRepo.prepare(x));

      // Act
      _tweekRepo.refresh();
      await (<any>_tweekRepo).waitRefreshCycle();

      // Assert
      const getKeysValuesPromises: Promise<any>[] = test.expectedKeys.map(x => _tweekRepo.get(x.keyName));

      try {
        const values = await Promise.all(getKeysValuesPromises);
        values.forEach((x, index) =>
          expect(x.value).to.eql(test.expectedKeys[index].value, 'should have correct value'),
        );
      } catch (ex) {
        console.log('failed getting keys');
        throw ex;
      }
    }),
  );
});
