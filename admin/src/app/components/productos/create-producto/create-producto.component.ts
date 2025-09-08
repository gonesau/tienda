import { Component, OnInit } from '@angular/core';

declare var iziToast: any;
declare var jQuery: any;
declare var $: any;

@Component({
  selector: 'app-create-producto',
  templateUrl: './create-producto.component.html',
  styleUrls: ['./create-producto.component.css']
})
export class CreateProductoComponent implements OnInit {

  public producto : any = {
  };
  public file : File = undefined;
  public imgSelect : any | ArrayBuffer = 'assets/img/01.png';

  constructor() { }

  ngOnInit(): void {
  }

  registro(registroForm){
    if(registroForm.valid){

    } else{
        iziToast.show({
          title: 'Error',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: 'Los datos del formulario no son válidos',
      });
    }
  }

  fileChangeEvent(event: any): void{
    var file;

    if(event.target.files && event.target.files[0]){
      file = <File>event.target.files[0];
      console.log(file);
    } else{
      iziToast.show({
          title: 'Error',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: 'No hay una imagen seleccionada',
      });

            $('#input-portada').text('Seleccionar imagen');
      this.imgSelect = 'assets/img/01.png';
      this.file = undefined;

    }

    // Validación tamaño
    if(file.size <= 5000000){
      // Validación tipo
      if(file.type == 'image/png' || file.type == 'image/webp' || file.type == 'image/jpg' || file.type == 'image/jpeg'){
        const reader = new FileReader();
        reader.onload = e => this.imgSelect = reader.result;
        reader.readAsDataURL(file);

        $('#input-portada').text(file.name);

        this.file = file;
      }else{
          iziToast.show({
          title: 'Error',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: 'La imagen debe ser png, webp, jpg o jpeg',
      });
      $('#input-portada').text('Seleccionar imagen');
      this.imgSelect = 'assets/img/01.png';
      this.file = undefined;
      }
    }
    else{
            iziToast.show({
          title: 'Error',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: 'La imagen no puede superar los 5MB',
      });
      $('#input-portada').text('Seleccionar imagen');
      this.imgSelect = 'assets/img/01.png';
      this.file = undefined;
    }



  }
}
