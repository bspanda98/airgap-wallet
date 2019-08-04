import { Router } from '@angular/router'
import { LoadingController, ToastController } from '@ionic/angular'
import { Action } from 'airgap-coin-lib/dist/actions/Action'
import { DelegateAction, DelegateActionContext, DelegateActionResult } from 'airgap-coin-lib/dist/actions/DelegateAction'

import { DataService, DataServiceKey } from '../../services/data/data.service'
import { ErrorCategory, handleErrorSentry } from '../../services/sentry-error-handler/sentry-error-handler'
import { WalletActionInfo } from '../ActionGroup'

export interface AirGapDelegateActionContext extends DelegateActionContext {
  toastController: ToastController
  loadingController: LoadingController
  dataService: DataService
  router: Router
}

export class AirGapDelegateAction extends Action<DelegateActionResult, AirGapDelegateActionContext> {
  public readonly info: WalletActionInfo = {
    name: 'account-transaction-list.delegate_label',
    icon: 'logo-usd'
  }

  protected data: {
    loader: HTMLIonLoadingElement | undefined
  }

  private readonly delegateAction: DelegateAction<AirGapDelegateActionContext>

  public constructor(context: AirGapDelegateActionContext) {
    super(context)
    this.delegateAction = new DelegateAction(context)
    this.setupOnComplete(context)
    this.setupOnError(context)
  }

  protected async perform(): Promise<DelegateActionResult> {
    const loader: HTMLIonLoadingElement = await this.delegateAction.context.loadingController.create({
      message: 'Preparing transaction...'
    })

    await loader.present().catch(handleErrorSentry(ErrorCategory.IONIC_LOADER))
    this.data.loader = loader

    await this.delegateAction.start()
    return this.delegateAction.result
  }

  private setupOnComplete(context: AirGapDelegateActionContext) {
    this.delegateAction.onComplete = async result => {
      if (this.data.loader) {
        this.data.loader.dismiss().catch(handleErrorSentry(ErrorCategory.IONIC_LOADER))
      }

      context.dataService.setData(DataServiceKey.INTERACTION, {
        wallet: context.wallet,
        airGapTx: result.airGapTx,
        data: result.dataUrl
      })
      context.router
        .navigateByUrl(`/interaction-selection/${DataServiceKey.INTERACTION}`)
        .catch(handleErrorSentry(ErrorCategory.NAVIGATION))
    }
  }

  private setupOnError(context: AirGapDelegateActionContext) {
    this.onError = async error => {
      handleErrorSentry(ErrorCategory.OTHER)(`${this.identifier}-${error}`)

      const toast: HTMLIonToastElement = await context.toastController.create({
        message: error.message,
        duration: 3000,
        position: 'bottom'
      })
      toast.present().catch(handleErrorSentry(ErrorCategory.IONIC_TOAST))
    }
  }
}
