import shortid from 'shortid'

import { byCost } from 'helpers'
import { RootState, selectors } from 'Redux/Store'

import {
  createArrayWithDefaultValues,
  createIdList,
  getRandomEntity,
  createSupply,
} from 'Redux/helpers'
import * as types from 'types'

import { BaseConfig } from '../types'
import { createSettingsSnapshot } from './createSettingsSnapshot'

const createSupplyIds = (
  state: RootState,
  cardIds: string[],
  supplySetup: types.IMarketSetup,
  seed: types.Seed
) => {
  const availableCards = selectors.Settings.Expansions.SelectedCards.getCardsByIdList(
    state,
    { cardIds }
  )

  const { gems, relics, spells, seed: resultSeed } = createSupply(
    availableCards,
    supplySetup.tiles,
    seed
  )
  const gemsByCost = gems.sort(byCost)
  const relicsByCost = relics.sort(byCost)
  const spellsByCost = spells.sort(byCost)

  return {
    result: [...gemsByCost, ...relicsByCost, ...spellsByCost].map(
      card => card.id
    ),
    seed: resultSeed,
  }
}

const createTreasureIds = (
  state: RootState,
  treasureIds: string[],
  variantId: string,
  seed: types.Seed
) => {
  const variant = selectors.Expeditions.Variants.getVariantById(state, {
    variantId,
  })

  // TODO someday we probably should extend the type so that we have a treasreBeforeFight and treasureAfterFight property
  const firstBattleConfig = variant.configList[0]
  const startsWithTreasure =
    firstBattleConfig.tier.tier > 1 && firstBattleConfig.treasure.hasTreasure

  const availableLevel1TreasureIds = selectors.Settings.Expansions.getTreasureIdsByLevelMappedFromIds(
    state,
    { treasureLevel: 1, treasureIds }
  )

  return startsWithTreasure
    ? createIdList(
        availableLevel1TreasureIds,
        createArrayWithDefaultValues(5, 'EMPTY'),
        getRandomEntity,
        seed
      )
    : { result: [], seed }
}

export const generateBattles = (
  state: RootState,
  variantId: string,
  expeditionId: string
) => {
  const variant = selectors.Expeditions.Variants.getVariantById(state, {
    variantId,
  })

  const battles = variant.configList.map(
    (config, index): types.Battle => {
      const isFirst = index === 0

      return {
        id: shortid.generate(),
        nemesisTier: config.tier,
        treasure: config.treasure,
        expeditionId,
        status: isFirst ? 'unlocked' : 'locked',
        tries: 0,
      }
    }
  )

  return battles
}

export const createExpeditionConfig = (
  getState: () => RootState,
  {
    variantId,
    name,
    bigPocketVariant,
    marketId,
    existingSettingsSnapshot,
    seedValue,
  }: BaseConfig
): types.Expedition => {
  const state = getState()

  /////////////////////////
  // Basic configuration //
  /////////////////////////

  const expeditionId = shortid.generate()
  const seed = {
    seed: seedValue || expeditionId,
  }
  const settingsSnapshot = createSettingsSnapshot(
    state,
    existingSettingsSnapshot,
    marketId
  )

  ///////////////////////////
  // Content randomziation //
  ///////////////////////////

  // Mages
  const mageIdsResult = createIdList(
    settingsSnapshot.availableMageIds,
    createArrayWithDefaultValues(4, 'EMPTY'),
    availableEntities => getRandomEntity(availableEntities, seed)
  )

  const mageIds = mageIdsResult.result

  // Supply
  const supplyIdsResult = createSupplyIds(
    state,
    settingsSnapshot.availableCardIds,
    settingsSnapshot.supplySetup,
    mageIdsResult.seed
  )

  const supplyIds = supplyIdsResult.result

  // Treasures
  const treasureIdsResult = createTreasureIds(
    state,
    settingsSnapshot.availableTreasureIds,
    variantId,
    supplyIdsResult.seed
  )
  const treasureIds = treasureIdsResult.result

  // Battles
  const battles = generateBattles(state, variantId, expeditionId)

  ////////////////
  // Expedition //
  ////////////////

  const newSeed = {
    seed: treasureIdsResult.seed.seed,
    supplyState: treasureIdsResult.seed.state || true,
    // this means that as soon as nemesis and nemesis cards are getting rolled
    // state will be used
    nemesisState: true,
  }

  return {
    id: expeditionId,
    name: name,
    score: 0,
    seed: newSeed,
    settingsSnapshot,
    barracks: {
      mageIds,
      supplyIds,
      treasureIds,
    },
    upgradedBasicNemesisCards: [],
    banished: [],
    variantId,
    bigPocketVariant: bigPocketVariant,
    battles,
    finished: false,
  }
}
