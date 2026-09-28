import h5py, numpy as np, os

SRC = 'data/raw/TCIR-ALL_2017.h5'
DST = 'data/raw/subset.h5'
N = 80

with h5py.File(SRC, 'r') as src, h5py.File(DST, 'w') as dst:
    total = src['matrix'].shape[0]
    idx = np.unique(np.linspace(0, total - 1, N).astype(int))

    m = dst.create_dataset('matrix', shape=(len(idx),) + src['matrix'].shape[1:],
                           dtype=src['matrix'].dtype, compression='gzip', compression_opts=4)
    for i, j in enumerate(idx):
        m[i] = src['matrix'][j]

    info = dst.create_group('info')
    info.create_dataset('block0_items', data=src['info/block0_items'][:])
    info.create_dataset('block0_values', data=src['info/block0_values'][idx])

print('samples:', len(idx))
print('size MB:', round(os.path.getsize(DST) / 1e6, 1))
with h5py.File(DST, 'r') as f:
    print('matrix', f['matrix'].shape)
    print('block0_values', f['info/block0_values'].shape)
    print('items', [c.decode() for c in f['info/block0_items'][:]])
