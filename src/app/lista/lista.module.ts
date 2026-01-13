import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ListaPageRoutingModule } from './lista-routing.module';
import { ListaPage } from './lista.page';

import { TaskCardComponent } from '../components/task-card/task-card.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ListaPageRoutingModule
  ],
  declarations: [
    ListaPage,
    TaskCardComponent  
  ]
})
export class ListaPageModule {}
