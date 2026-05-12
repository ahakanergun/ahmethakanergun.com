---
title: "React 15'ten 18'e Yükseltme"
description: React 15.6 versiyonuyla yazılan ve Class Componentler içeren uygulamamızı uzun bir süredir React 16 sürümü üstüne güncelleme fikrimiz vardı React 18 versiyonu çıkmasına rağmen bu geçişi sağlayamamıştık. Şimdi ise direk R
pubDate: 2023-10-16T20:54:00.000Z
tags: []
categories: [Genel]
legacyURL: /react-15ten-18e-yukseltme
---
React 15.6 versiyonuyla yazılan ve Class Componentler içeren uygulamamızı uzun bir süredir React 16 sürümü üstüne güncelleme fikrimiz vardı React 18 versiyonu çıkmasına rağmen bu geçişi sağlayamamıştık. Şimdi ise direk React 18'e güncelleme işine kalkıştık ve bir çok bağımlılığı güncellememize rağmen binlerce satır class componentimizi tam anlamıyla yeni yapıya daha uygun mimariye taşıyamadık. Yine de bu yolda bizim de attığımız ilk bir kaç adımı paylaşmak istedim.

* * *

### 1\. **React ve ReactDOM Paketlerini Güncellemek**

React 18’in sunduğu yeniliklerden faydalanmak için önce paketlerimizi güncellemeliyiz

#### Komutlar:

```
npm install react@18 react-dom@18
```

**Not:** Eğer projende eski bir paket bağımlılığı varsa, bu güncelleme sırasında bazı uyarılar alabilirsiniz.

Eski kütüphaneler (örneğin, animasyon ya da form yönetim kütüphaneleri) sorun çıkarması muhtemel yapılardır, bunları teker teker yükseltin ya da başka paketlerle değiştirin.

* * *

### 2\. **ReactDOM.render Yerine ReactDOM.createRoot Kullanmak**

React 18’de, `ReactDOM.render` yerini yeni `ReactDOM.createRoot` API’sine bırakıyor.

#### Eskiden Nasıl Yapıyorduk?

```
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
```

#### React 18 ile Birlikte:

```
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

**Neden?** Yeni API, React 18’in Concurrent Mode’unu destekliyor ve performansı artırıyor.

* * *

### 3\. **Class Componentleri Functional Componentlere Taşıma**

React 15’in yazıldığı dönemlerde class componentler yaygındı. Biz de uygulamamızı Class Component cehennemine çevirdik :) Ancak React Hooks’un tanıtılmasıyla functional componentler daha güçlü bir hale geldi. Peki, class componentleri nasıl functional hale getirebiliriz?

#### Örnek: Bir Sayaç Componenti

##### Class Component:

```
import React from 'react';

class Counter extends React.Component {
  state = { count: 0 };

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    return (
      <div>
        <p>Sayaç: {this.state.count}</p>
        <button onClick={this.increment}>Arttır</button>
      </div>
    );
  }
}

export default Counter;
```

##### Functional Component:

```
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <p>Sayaç: {count}</p>
      <button onClick={increment}>Arttır</button>
    </div>
  );
}

export default Counter;
```

**Neden Functional Component?** Daha az kod, daha rahat okunabilirlik ve Hooks sayesinde güçlü bir state yönetimine kavuşursunuz.

* * *

### 4\. **Lifecycle Metotları Yerine Hooks Kullanımı**

#### Örnek: `componentDidMount` ve `componentDidUpdate`

##### Class Component:

```
class MyComponent extends React.Component {
  componentDidMount() {
    console.log('Bileşen yüklendi!');
  }

  componentDidUpdate() {
    console.log('Bileşen güncellendi!');
  }

  render() {
    return <div>Merhaba React!</div>;
  }
}
```

##### Functional Component:

```
import React, { useEffect } from 'react';

function MyComponent() {
  useEffect(() => {
    console.log('Bileşen yüklendi!');
    return () => console.log('Bileşen temizleniyor!');
  }, []); // [] bağımlılık dizisi sadece ilk çalışmada tetiklenir.

  useEffect(() => {
    console.log('Bileşen güncellendi!');
  });

  return <div>Merhaba React!</div>;
}
```

* * *

### 5\. **Concurrent Rendering’e Dikkat**

React 18’deki en büyük yeniliklerden biri concurrent rendering. Bu, kullanıcı etkileşimlerini daha akıcı hale getirir ama yan etkilerini kontrol etmek gereklidir.

```
class MyComponent extends React.Component {
  state = { count: 0 };

  componentDidUpdate() {
    console.log('Güncelleme oldu!');
    document.title = `Sayaç: ${this.state.count}`;
  }

  render() {
    return (
      <button onClick={() => this.setState({ count: this.state.count + 1 })}>
        Arttır
      </button>
    );
  }
}
```

Bu örnekte, gereksiz güncellemelerden kaçınmak için yan etkileri kontrol etmeliyiz.
