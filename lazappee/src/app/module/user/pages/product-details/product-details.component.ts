import { Component, OnInit } from '@angular/core';
import { ProductsService } from '../../../../service/products.service';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule, Location } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { switchMap, of } from 'rxjs';
import { Product } from '../../product';
import { FormatterPipe } from '../../../../pipe/formatter.pipe';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormatterPipe],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent implements OnInit {
  product: Product[] = [];
  cartId: any;
  currId: any;
  productId: any;
  quantity = 1;
  totalPrice = 0;

  constructor(
    private service: ProductsService,
    private router: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.currId = this.service.getCurrentUserId();
    this.cartId = this.service.getUserCart();
    this.router.params.subscribe((param) => {
      this.productId = +param['id'];
      this.loadProduct(this.productId);
    });

    const savedQuantity = localStorage.getItem(
      `product-id-${this.currId}-${this.productId}`
    );
    if (savedQuantity) {
      this.quantity = parseInt(savedQuantity, 10);
    }
  }

  loadProduct(id: any) {
    this.service.getAllProducts(null, id).subscribe({
      next: (result: any) => {
        if (result.payload && Array.isArray(result.payload)) {
          this.product = result.payload.map((item: any) => ({
            ...item,

            product_image$: this.service.getProductImage(item.id).pipe(
              switchMap((imageResult) => {
                if (imageResult.size > 0) {
                  const url = URL.createObjectURL(imageResult);
                  return of(this.sanitizer.bypassSecurityTrustResourceUrl(url));
                } else {
                  return of(undefined);
                }
              })
            ),
          }));
        }

        this.totalItemPrice();
      },
    });
  }

  addtoCart(quantity: number) {
    const data = {
      user_id: this.currId,
      cart_id: this.cartId,
      product_id: this.productId,
      quantity: quantity,
    };
    Swal.fire({
      title: 'Add this to cart?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.addToCart(data).subscribe(
          (response) => {
            const Toast = Swal.mixin({
              toast: true,
              position: 'bottom-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
              },
            });
            Toast.fire({
              icon: 'success',
              title: 'Item added to cart',
            });
            this.saveQuantity();
            console.log(this.quantity);
          },
          (error) => {
            console.error('Error adding product to cart', error);
          }
        );
      }
    });
  }

  buyNow(quantity: number) {
    const data = {
      user_id: this.currId,
      product_id: this.productId,
      quantity: quantity,
    };
    Swal.fire({
      title: 'Are you sure you want to purchase this item?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, buy it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.buyNow(data).subscribe(
          (response) => {
            const Toast = Swal.mixin({
              toast: true,
              position: 'bottom-end',
              showConfirmButton: false,
              background: '#fff',
              color: '#111',
              timer: 3000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
              },
            });
            Toast.fire({
              title: 'Order placed!',
              icon: 'success',
            });
            localStorage.removeItem(
              `product-id-${this.currId}-${this.productId}`
            );
            this.quantity = 1;
          },
          (error) => {
            console.error('Error during purchase', error);
          }
        );
      }
    });
  }

  incrementQuantity() {
    if (this.quantity < this.product[0].stock) {
      this.quantity++;
    }
    this.totalItemPrice();
  }

  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
    this.totalItemPrice();
  }

  saveQuantity() {
    localStorage.setItem(
      `product-id-${this.currId}-${this.productId}`,
      this.quantity.toString()
    );
  }

  totalItemPrice() {
    this.totalPrice = this.product[0].price;
    this.totalPrice = Math.round(this.quantity * this.product[0].price);
  }

  goBack() {
    this.location.back();
  }
}
