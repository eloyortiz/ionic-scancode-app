import { Injectable } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { File } from '@ionic-native/file/ngx';
import { EmailComposer } from '@ionic-native/email-composer/ngx';
import { Registro } from '../models/registro.model';

@Injectable({
  providedIn: 'root'
})
export class DataLocalService {

  public guardados: Registro[] = [];
  private ficheroCSV = 'registros.csv';

  constructor( private storage: Storage,
              private navCtrl: NavController,
              private iab: InAppBrowser,
              private file: File,
              private emailComposer: EmailComposer ) {
    this.cargarStorage();
  }

  async cargarStorage(){
    this.guardados = await this.storage.get('registros') || [];
  }

  async guardarRegistro( format: string, text: string){

    await this.cargarStorage();

    const nuevoRegistro = new Registro( format, text );
    this.guardados.unshift( nuevoRegistro );

    console.log('this.guardados :>> ', this.guardados);
    this.storage.set('registros', this.guardados);

    this.abrirRegistro( nuevoRegistro );

  }

  abrirRegistro( registro: Registro){
    this.navCtrl.navigateForward('/tabs/tab2');

    switch( registro.type ){
      case 'http':
        this.iab.create(registro.text, '_system');
        break;
      
        case 'geo':
          this.navCtrl.navigateForward(`/tabs/tab2/mapa/${ registro.text }`);
          break;
    }

  }

  enviarCorreo(){

    const arrTemp = [];
    const titulos = 'Tipo, Formato, Creado en, Texto\n';

    arrTemp.push(titulos);

    this.guardados.forEach( registro => {
      const linea = `${ registro.type }, ${ registro.format }, ${ registro.created }, ${ registro.text.replace(',', ' ') }\n`;
      arrTemp.push(linea);
    });

    console.log( arrTemp.join('') );
    this.crearArchivoFisico( arrTemp.join('') );
  }

  crearArchivoFisico( text: string ){

    this.file.checkFile( this.file.dataDirectory, this.ficheroCSV )
      .then( existe => {
        console.log('existe archivo?', existe);
        return this.escribirEnArchivo( text );
      })
      .catch( err => {
        return this.file.createFile( this.file.dataDirectory, this.ficheroCSV, false )
          .then( creado => this.escribirEnArchivo( text ) )
          .catch( err2 => console.log('No se pudo crear el archivo', err2) )
      })

  }

  async escribirEnArchivo( text: string ){

    await this.file.writeExistingFile( this.file.dataDirectory, this.ficheroCSV, text );


    const archivo = this.file.dataDirectory + this.ficheroCSV;

  

    const email = {
      to: 'ortizpulido.eloy@gmail.com',
      // cc: 'erika@mustermann.de',
      // bcc: ['john@doe.com', 'jane@doe.com'],
      attachments: [
        archivo
      ],
      subject: '[ScanCode] Backup historial de escaneos',
      body: 'Aquí tiene su backup del historial de escaneos en <strong>ScanCode</strong>',
      isHtml: true
    };
    
    // Send a text message using default options
    this.emailComposer.open(email);
  }

}
